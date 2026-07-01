import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { create } from "zustand";

import { supabase } from "../utils/supabase";
import { useOnboarding } from "./use-onboarding";

export function getAuthRedirectUrl(): string {
  if (process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL) {
    return process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;
  }

  try {
    return Linking.createURL("/");
  } catch {
    return "lucrocaseiro://";
  }
}

// Extrai tokens (implicit) ou code (PKCE) de uma URL de callback OAuth.
function getAuthParamsFromUrl(rawUrl: string): {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
} {
  const url = new URL(rawUrl);
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const fromHash = new URLSearchParams(hash);
  const fromQuery = url.searchParams;
  const pick = (key: string) => fromQuery.get(key) ?? fromHash.get(key);
  return {
    code: pick("code"),
    accessToken: pick("access_token"),
    refreshToken: pick("refresh_token"),
  };
}

/**
 * Aplica a sessao a partir da URL de callback do OAuth. Suporta tanto PKCE
 * (`?code=`) quanto implicit (`#access_token=`). Idempotente: se ja existe
 * sessao, ignora (evita "code already used" quando o callback chega 2x).
 */
async function applySessionFromUrl(rawUrl: string): Promise<boolean> {
  let params: ReturnType<typeof getAuthParamsFromUrl>;
  try {
    params = getAuthParamsFromUrl(rawUrl);
  } catch {
    return false;
  }

  const { code, accessToken, refreshToken } = params;
  if (!code && !accessToken) return false;

  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return true;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  }
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return !error;
  }
  return false;
}

interface AuthState {
  token: string | null;
  userId: string | null;
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  passwordRecovery: boolean;

  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
    businessName?: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  clearPasswordRecovery: () => void;
}

function setSession(set: (state: Partial<AuthState>) => void, session: Session | null) {
  if (session) {
    set({
      token: session.access_token,
      userId: session.user.id,
      user: session.user,
      session,
      isAuthenticated: true,
    });
  } else {
    set({
      token: null,
      userId: null,
      user: null,
      session: null,
      isAuthenticated: false,
    });
  }
}

function signUpErrorMessage(error: { message: string; code?: string; status?: number }) {
  const message = error.message.toLowerCase();

  if (message.includes("already registered") || message.includes("already exists")) {
    return "Esse e-mail já tem uma conta. Tente entrar.";
  }
  if (message.includes("password should be") || message.includes("weak password")) {
    return "Senha muito fraca. Use pelo menos 8 caracteres com letras e numeros.";
  }
  if (message.includes("invalid email")) {
    return "Confira o e-mail digitado e tente novamente.";
  }
  if (message.includes("email rate limit") || error.status === 429) {
    return "Muitas tentativas seguidas. Espere um pouco e tente novamente.";
  }
  if (message.includes("signups not allowed")) {
    return "Cadastro indisponível no momento. Ative novos cadastros no Supabase.";
  }
  if (message.includes("confirmation") || message.includes("sending")) {
    return "Não consegui enviar o e-mail de confirmação. Verifique a configuração de e-mail no Supabase.";
  }
  if (message.includes("database error") || message.includes("saving new user")) {
    return "Não consegui preparar sua conta no banco. Verifique o trigger de criação de usuário no Supabase.";
  }

  return `Não foi possível criar a conta: ${error.message}`;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  userId: null,
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  passwordRecovery: false,

  initialize: async () => {
    try {
      // Timeout to prevent infinite loading if Supabase is unreachable
      const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000),
      );
      const sessionPromise = supabase.auth.getSession();

      const result = await Promise.race([sessionPromise, timeout]);
      const session = result
        ? (result as { data: { session: Session | null } }).data.session
        : null;

      if (session) {
        set({
          token: session.access_token,
          userId: session.user.id,
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(set, session);
      });

      // Captura o callback do OAuth mesmo quando o Android reabre o app pelo
      // deep link (lucrocaseiro://) em vez de retornar pro browser in-app.
      const handleUrl = (url: string | null) => {
        if (url && (url.includes("code=") || url.includes("access_token="))) {
          void applySessionFromUrl(url).then((ok) => {
            // Link de recuperação de senha chega com type=recovery: marca o modo
            // recovery para o app abrir a tela de "criar nova senha".
            if (ok && url.includes("type=recovery")) {
              set({ passwordRecovery: true });
            }
          });
        }
      };
      handleUrl(await Linking.getInitialURL());
      Linking.addEventListener("url", ({ url }) => handleUrl(url));
    } catch {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "E-mail ou senha incorretos" };
      }
      if (error.message.includes("Email not confirmed")) {
        return {
          error: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
        };
      }
      return { error: "Erro ao entrar. Tente novamente." };
    }

    // Não marca onboarding como concluído aqui: quem decide é o index.tsx pelo
    // businessName do perfil (servidor). Forçar aqui pulava o onboarding de
    // contas novas que entram por "Entrar" em vez de "Criar conta".
    return {};
  },

  signUpWithEmail: async (email, password, name, businessName) => {
    const { error, data } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name,
          business_name: businessName,
        },
      },
    });

    if (error) {
      if (__DEV__) {
        console.warn("[auth] signUpWithEmail failed", {
          code: error.code,
          message: error.message,
          status: error.status,
        });
      }
      return { error: signUpErrorMessage(error) };
    }

    // Confirmação de e-mail desativada no Supabase: o signUp já devolve sessão
    // e o usuário entra na hora. Quando ativada, não há sessão e ele precisa
    // confirmar pelo e-mail antes de entrar.
    if (data.session) {
      setSession(set, data.session);
      return {};
    }

    return { needsConfirmation: true };
  },

  signInWithGoogle: async () => {
    try {
      const authRedirectUrl = getAuthRedirectUrl();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authRedirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        return { error: "Erro ao conectar com Google. Tente novamente." };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl);

      if (result.type === "success" && result.url) {
        const ok = await applySessionFromUrl(result.url);
        return ok ? {} : { error: "Erro ao finalizar login com Google." };
      }

      // No Android o redirect pode reabrir o app pelo deep link em vez de voltar
      // aqui (result vem "dismiss"). O listener global aplica a sessao quando o
      // deep link chega; aguardamos (poll) ela aparecer antes de tratar como
      // cancelamento.
      if (String(result.type) === "cancel" || String(result.type) === "dismiss") {
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          const { data: after } = await supabase.auth.getSession();
          if (after.session) {
            return {};
          }
        }
        return { error: "Login cancelado." };
      }

      return { error: "Não foi possível completar o login com Google." };
    } catch {
      return { error: "Erro ao entrar com Google. Tente novamente." };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // O estado de onboarding e por aparelho; ao trocar de conta, a proxima
    // que entrar decide de novo (quem ja tem businessName pula sozinha).
    useOnboarding.getState().reset();
    set({
      token: null,
      userId: null,
      user: null,
      session: null,
      isAuthenticated: false,
      passwordRecovery: false,
    });
  },

  clearPasswordRecovery: () => set({ passwordRecovery: false }),
}));
