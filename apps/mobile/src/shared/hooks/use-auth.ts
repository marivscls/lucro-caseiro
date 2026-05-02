import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { create } from "zustand";

import { supabase } from "../utils/supabase";

interface AuthState {
  token: string | null;
  userId: string | null;
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
    businessName?: string,
  ) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
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

export const useAuth = create<AuthState>((set) => ({
  token: null,
  userId: null,
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

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
      if (error.message.includes("already registered")) {
        return { error: "Esse e-mail ja tem uma conta. Tente entrar." };
      }
      if (error.message.includes("Password should be")) {
        return {
          error: "Senha muito fraca. Use pelo menos 8 caracteres com letras e numeros.",
        };
      }
      return { error: "Erro ao criar conta. Tente novamente." };
    }

    // If email confirmation is disabled, user is logged in immediately
    if (data.session) {
      setSession(set, data.session);
    }

    return {};
  },

  signInWithGoogle: async () => {
    try {
      // For Expo Go, use the Supabase project URL as redirect
      // This ensures the OAuth callback works on both iOS and Android
      const redirectUrl = "https://ujwxvpceqigvyxcqolch.supabase.co/auth/v1/callback";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        return { error: "Erro ao conectar com Google. Tente novamente." };
      }

      // Use the Expo scheme for the return URL so the browser comes back to the app
      const appRedirectUrl = Linking.createURL("/");

      const result = await WebBrowser.openAuthSessionAsync(data.url, appRedirectUrl);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);

        // Handle fragment-based response (#access_token=...&refresh_token=...)
        const params = new URLSearchParams(
          url.hash ? url.hash.substring(1) : url.search.substring(1),
        );

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            return { error: "Erro ao finalizar login com Google." };
          }

          return {};
        }
      }

      if (String(result.type) === "cancel" || String(result.type) === "dismiss") {
        return { error: "Login cancelado." };
      }

      return { error: "Nao foi possivel completar o login com Google." };
    } catch {
      return { error: "Erro ao entrar com Google. Tente novamente." };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      token: null,
      userId: null,
      user: null,
      session: null,
      isAuthenticated: false,
    });
  },
}));
