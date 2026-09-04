import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { create } from "zustand";

import { supabase } from "../utils/supabase";
import { withoutAuthParams } from "../utils/auth-url";
import { getRecoveryLinkError } from "../utils/password-recovery";
import { useOnboarding } from "./use-onboarding";

export function getAuthRedirectUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return new URL("/", window.location.origin).toString();
  }

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
async function applySessionFromUrl(
  rawUrl: string,
  replaceExisting = false,
): Promise<boolean> {
  let params: ReturnType<typeof getAuthParamsFromUrl>;
  try {
    params = getAuthParamsFromUrl(rawUrl);
  } catch {
    return false;
  }

  const { code, accessToken, refreshToken } = params;
  if (!code && !accessToken) return false;

  const { data: existing } = await supabase.auth.getSession();
  if (existing.session && !replaceExisting) return true;

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

function clearBrowserAuthParams(rawUrl: string): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  try {
    const cleanUrl = new URL(withoutAuthParams(rawUrl));
    if (cleanUrl.toString() === rawUrl) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
    );
  } catch {
    // URL inválida não deve impedir a inicialização da autenticação.
  }
}

const NATIVE_AUTH_CALLBACK_TIMEOUT_MS = 8_000;

function waitForNativeAuthCallback(returnUrl: string): {
  promise: Promise<string | null>;
  cancel: () => void;
} {
  let settle: (url: string | null) => void = () => {};
  const promise = new Promise<string | null>((resolve) => {
    let settled = false;
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith(returnUrl)) settle(url);
    });

    settle = (url) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.remove();
      resolve(url);
    };
    const timer = setTimeout(() => settle(null), NATIVE_AUTH_CALLBACK_TIMEOUT_MS);
  });

  return { promise, cancel: () => settle(null) };
}

interface AuthState {
  token: string | null;
  userId: string | null;
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  passwordRecovery: boolean;
  passwordRecoveryError: string | null;

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

type AuthFailure = {
  readonly message?: unknown;
  readonly code?: unknown;
  readonly status?: unknown;
  readonly name?: unknown;
};

function signInErrorMessage(error: AuthFailure) {
  const rawMessage = typeof error.message === "string" ? error.message.trim() : "";
  const message = rawMessage.toLowerCase();
  const code = typeof error.code === "string" ? error.code.toLowerCase() : "";
  const status = typeof error.status === "number" ? error.status : undefined;
  const name = typeof error.name === "string" ? error.name : "";

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  if (code === "over_request_rate_limit" || status === 429) {
    return "Muitas tentativas seguidas. Espere um pouco e tente novamente.";
  }
  if (
    name === "AuthRetryableFetchError" ||
    status === 0 ||
    rawMessage === "{}" ||
    !rawMessage
  ) {
    return "Não foi possível conectar. Verifique sua internet e tente novamente.";
  }

  return "Não foi possível entrar agora. Tente novamente em alguns instantes.";
}

function signUpErrorMessage(error: AuthFailure) {
  const rawMessage = typeof error.message === "string" ? error.message.trim() : "";
  const message = rawMessage.toLowerCase();
  const code = typeof error.code === "string" ? error.code.toLowerCase() : "";
  const status = typeof error.status === "number" ? error.status : undefined;
  const name = typeof error.name === "string" ? error.name : "";

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "Esse e-mail já tem uma conta. Tente entrar.";
  }
  if (
    code === "weak_password" ||
    message.includes("password should be") ||
    message.includes("weak password")
  ) {
    return "Senha muito fraca. Use pelo menos 8 caracteres com letras e numeros.";
  }
  if (code === "email_address_invalid" || message.includes("invalid email")) {
    return "Confira o e-mail digitado e tente novamente.";
  }
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    message.includes("email rate limit") ||
    status === 429
  ) {
    return "Muitas tentativas seguidas. Espere um pouco e tente novamente.";
  }
  if (
    code === "signup_disabled" ||
    code === "email_provider_disabled" ||
    message.includes("signups not allowed")
  ) {
    return "Cadastro indisponível no momento. Tente novamente mais tarde.";
  }
  if (message.includes("confirmation") || message.includes("sending")) {
    return "Não foi possível enviar o e-mail de confirmação. Tente novamente em alguns minutos.";
  }
  if (message.includes("database error") || message.includes("saving new user")) {
    return "Não foi possível concluir o cadastro agora. Tente novamente em alguns minutos.";
  }
  if (
    name === "AuthRetryableFetchError" ||
    status === 0 ||
    rawMessage === "{}" ||
    !rawMessage
  ) {
    return "Não foi possível conectar para criar sua conta. Verifique sua internet e tente novamente.";
  }

  return "Não foi possível criar sua conta agora. Tente novamente em alguns instantes.";
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  userId: null,
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  passwordRecovery: false,
  passwordRecoveryError: null,

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

      setSession(set, session);

      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(set, session);
      });

      // Captura o callback do OAuth mesmo quando o Android reabre o app pelo
      // deep link (lucrocaseiro://) em vez de retornar pro browser in-app.
      const handleUrl = async (url: string | null) => {
        try {
          const recoveryError = url ? getRecoveryLinkError(url) : null;
          if (recoveryError) {
            set({ passwordRecovery: false, passwordRecoveryError: recoveryError });
            return;
          }
          if (url && (url.includes("code=") || url.includes("access_token="))) {
            const isRecovery = url.includes("type=recovery");
            const ok = await applySessionFromUrl(url, isRecovery);
            // Link de recuperação de senha chega com type=recovery: marca o modo
            // recovery para o app abrir a tela de "criar nova senha".
            if (ok && isRecovery)
              set({ passwordRecovery: true, passwordRecoveryError: null });
          }
        } finally {
          if (url) clearBrowserAuthParams(url);
        }
      };
      await handleUrl(await Linking.getInitialURL());
      Linking.addEventListener("url", ({ url }) => void handleUrl(url));
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (__DEV__) {
          console.warn("[auth] signInWithEmail failed", {
            code: error.code,
            message: error.message,
            name: error.name,
            status: error.status,
          });
        }
        return { error: signInErrorMessage(error) };
      }

      // Não marca onboarding como concluído aqui: quem decide é o index.tsx pela
      // metadata persistida e pelos fallbacks de conta nova. Forçar aqui pulava
      // o onboarding de contas novas que entram por "Entrar".
      return {};
    } catch (error) {
      if (__DEV__) {
        console.warn("[auth] signInWithEmail threw", error);
      }
      return {
        error: signInErrorMessage(
          typeof error === "object" && error !== null ? error : {},
        ),
      };
    }
  },

  signUpWithEmail: async (email, password, name, businessName) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: {
            name,
            business_name: businessName,
            onboarding_completed: false,
          },
        },
      });

      if (error) {
        if (__DEV__) {
          console.warn("[auth] signUpWithEmail failed", {
            code: error.code,
            message: error.message,
            name: error.name,
            status: error.status,
          });
        }
        return { error: signUpErrorMessage(error) };
      }

      // Guarda a intenção no momento exato do cadastro. Assim o onboarding ainda
      // aparece se a confirmação por e-mail mandar a pessoa para o login antes de
      // criar a sessão. O Supabase devolve `identities: []` quando oculta que um
      // e-mail já está cadastrado; nesse caso não tratamos a conta como nova.
      if (data.user?.identities?.length) {
        useOnboarding.getState().startOnboarding(data.user.id);
      }

      // Confirmação de e-mail desativada no Supabase: o signUp já devolve sessão
      // e o usuário entra na hora. Quando ativada, não há sessão e ele precisa
      // confirmar pelo e-mail antes de entrar.
      if (data.session) {
        setSession(set, data.session);
        return {};
      }

      return { needsConfirmation: true };
    } catch (error) {
      if (__DEV__) {
        console.warn("[auth] signUpWithEmail threw", error);
      }
      return {
        error: signUpErrorMessage(
          typeof error === "object" && error !== null ? error : {},
        ),
      };
    }
  },

  signInWithGoogle: async () => {
    let callbackWaiter: ReturnType<typeof waitForNativeAuthCallback> | null = null;
    try {
      const authRedirectUrl = getAuthRedirectUrl();
      const isWeb = Platform.OS === "web";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authRedirectUrl,
          skipBrowserRedirect: !isWeb,
        },
      });

      if (error || !data.url) {
        return { error: "Erro ao conectar com Google. Tente novamente." };
      }

      // O Supabase redireciona a propria aba no navegador. O popup do Expo
      // exige um handshake adicional e pode deixar o PWA esperando para sempre.
      if (isWeb) return {};

      // No Android, o WebBrowser pode observar o app ativo antes de o evento de
      // deep link chegar e retornar `dismiss`. Mantemos um listener próprio para
      // que esse fechamento técnico não seja confundido com cancelamento humano.
      callbackWaiter = waitForNativeAuthCallback(authRedirectUrl);
      const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl);

      if (result.type === "success" && result.url) {
        callbackWaiter.cancel();
        const ok = await applySessionFromUrl(result.url);
        return ok ? {} : { error: "Erro ao finalizar login com Google." };
      }

      // O redirect pode reabrir o app antes de o WebBrowser receber a URL.
      // Aguarda o callback explícito e o aplica; a consulta da sessão cobre o
      // listener global caso ele tenha vencido a corrida.
      if (String(result.type) === "cancel" || String(result.type) === "dismiss") {
        const callbackUrl = await callbackWaiter.promise;
        if (callbackUrl && (await applySessionFromUrl(callbackUrl))) {
          return {};
        }
        const { data: after } = await supabase.auth.getSession();
        if (after.session) return {};
        return {
          error: "Não foi possível concluir o login com Google. Tente novamente.",
        };
      }

      return { error: "Não foi possível completar o login com Google." };
    } catch {
      return { error: "Erro ao entrar com Google. Tente novamente." };
    } finally {
      callbackWaiter?.cancel();
    }
  },

  signOut: async () => {
    // `scope: "local"` encerra a sessão neste aparelho sem esperar a API.
    // O logout global pode travar ou falhar na rede; se a UI esperar, a tela
    // privada fica montada com o cache já zerado e parece uma conta vazia.
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // O estado local abaixo é a fonte da verdade para a UI.
    }
    // O estado de onboarding e por aparelho. Ao sair, fecha o guia de Primeiros
    // Passos desta conta para o próximo login não reabrir o overlay em tela cheia.
    const userId = get().userId;
    if (userId) useOnboarding.getState().dismissGettingStarted(userId);
    useOnboarding.getState().reset();
    set({
      token: null,
      userId: null,
      user: null,
      session: null,
      isAuthenticated: false,
      passwordRecovery: false,
      passwordRecoveryError: null,
    });
  },

  clearPasswordRecovery: () => set({ passwordRecovery: false }),
}));
