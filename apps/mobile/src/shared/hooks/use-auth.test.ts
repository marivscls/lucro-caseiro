import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import type { AuthError, User } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { supabase } from "../utils/supabase";
import { useOnboarding } from "./use-onboarding";
import { getAuthRedirectUrl, useAuth } from "./use-auth";

const platform = Platform as typeof Platform & { OS: string };
const originalPlatform = platform.OS;

afterEach(() => {
  platform.OS = originalPlatform;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getAuthRedirectUrl", () => {
  it("usa o callback da origem atual no PWA", () => {
    platform.OS = "web";
    vi.stubEnv("EXPO_PUBLIC_AUTH_REDIRECT_URL", "lucrocaseiro://auth/callback");

    expect(getAuthRedirectUrl()).toBe(`${window.location.origin}/`);
  });

  it("mantem o deep link configurado no app nativo", () => {
    platform.OS = "android";
    vi.stubEnv("EXPO_PUBLIC_AUTH_REDIRECT_URL", "lucrocaseiro://auth/callback");

    expect(getAuthRedirectUrl()).toBe("lucrocaseiro://auth/callback");
  });

  it("deixa o Supabase redirecionar a aba no PWA sem abrir popup", async () => {
    platform.OS = "web";
    const signInWithOAuth = vi.spyOn(supabase.auth, "signInWithOAuth").mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.com/oauth" },
      error: null,
    });
    const openAuthSession = vi.mocked(WebBrowser.openAuthSessionAsync);

    const result = await useAuth.getState().signInWithGoogle();

    expect(result).toEqual({});
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        skipBrowserRedirect: false,
      },
    });
    expect(openAuthSession).not.toHaveBeenCalled();
  });

  it("conclui no Android quando o deep link chega depois de o navegador retornar dismiss", async () => {
    platform.OS = "android";
    vi.stubEnv("EXPO_PUBLIC_AUTH_REDIRECT_URL", "lucrocaseiro://auth/callback");
    vi.spyOn(supabase.auth, "signInWithOAuth").mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.com/oauth" },
      error: null,
    });
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const setSession = vi.spyOn(supabase.auth, "setSession").mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    let deliverCallback: ((event: { url: string }) => void) | undefined;
    vi.spyOn(Linking, "addEventListener").mockImplementation((_type, handler) => {
      deliverCallback = handler;
      return {
        remove: vi.fn(),
      } as unknown as ReturnType<typeof Linking.addEventListener>;
    });
    vi.mocked(WebBrowser.openAuthSessionAsync).mockImplementation(() => {
      deliverCallback?.({
        url: "lucrocaseiro://auth/callback#access_token=access&refresh_token=refresh",
      });
      return Promise.resolve({ type: "dismiss" }) as ReturnType<
        typeof WebBrowser.openAuthSessionAsync
      >;
    });

    const result = await useAuth.getState().signInWithGoogle();

    expect(result).toEqual({});
    expect(setSession).toHaveBeenCalledWith({
      access_token: "access",
      refresh_token: "refresh",
    });
  });

  it("usa o código do Supabase para explicar credenciais inválidas", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValue({
      data: { user: null, session: null },
      error: {
        name: "AuthApiError",
        message: "Unexpected provider wording",
        code: "invalid_credentials",
        status: 400,
      } as AuthError,
    });

    const result = await useAuth.getState().signInWithEmail("conta@exemplo.com", "senha");

    expect(result).toEqual({ error: "E-mail ou senha incorretos" });
  });

  it("explica falha de conexão no login sem exibir o erro técnico", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValue({
      data: { user: null, session: null },
      error: {
        name: "AuthRetryableFetchError",
        message: "{}",
        status: 0,
      } as AuthError,
    });

    const result = await useAuth.getState().signInWithEmail("conta@exemplo.com", "senha");

    expect(result).toEqual({
      error: "Não foi possível conectar. Verifique sua internet e tente novamente.",
    });
    expect(result.error).not.toContain("{}");
  });

  it("trata exceção de transporte durante o login", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockRejectedValue({});

    const result = await useAuth.getState().signInWithEmail("conta@exemplo.com", "senha");

    expect(result).toEqual({
      error: "Não foi possível conectar. Verifique sua internet e tente novamente.",
    });
  });

  it("mantem o onboarding pendente quando o cadastro exige login depois", async () => {
    const userId = "67e5db17-3f41-46ee-9dbd-9df536cf3d2c";
    const user = {
      id: userId,
      identities: [{ id: "email-identity" }],
    } as User;
    const signUp = vi.spyOn(supabase.auth, "signUp").mockResolvedValue({
      data: { user, session: null },
      error: null,
    });
    useOnboarding.setState({ pendingUserIds: [] });

    const result = await useAuth
      .getState()
      .signUpWithEmail("nova@conta.com", "Senha123!", "Nova Conta");

    expect(result).toEqual({ needsConfirmation: true });
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({ onboarding_completed: false }),
        }),
      }),
    );
    expect(useOnboarding.getState().pendingUserIds).toContain(userId);
  });

  it("explica a falha de conexão sem exibir o objeto técnico vazio", async () => {
    vi.spyOn(supabase.auth, "signUp").mockResolvedValue({
      data: { user: null, session: null },
      error: {
        name: "AuthRetryableFetchError",
        message: "{}",
        status: 0,
      } as AuthError,
    });

    const result = await useAuth
      .getState()
      .signUpWithEmail("nova@conta.com", "Senha123!", "Nova Conta");

    expect(result).toEqual({
      error:
        "Não foi possível conectar para criar sua conta. Verifique sua internet e tente novamente.",
    });
    expect(result.error).not.toContain("{}");
  });

  it("prioriza o código de e-mail existente mesmo sem mensagem útil", async () => {
    vi.spyOn(supabase.auth, "signUp").mockResolvedValue({
      data: { user: null, session: null },
      error: {
        name: "AuthApiError",
        message: "{}",
        code: "user_already_exists",
        status: 422,
      } as AuthError,
    });

    const result = await useAuth
      .getState()
      .signUpWithEmail("existente@conta.com", "Senha123!", "Conta Existente");

    expect(result).toEqual({
      error: "Esse e-mail já tem uma conta. Tente entrar.",
    });
  });

  it("trata exceção sem mensagem e sempre devolve um alerta amigável", async () => {
    vi.spyOn(supabase.auth, "signUp").mockRejectedValue({});

    const result = await useAuth
      .getState()
      .signUpWithEmail("nova@conta.com", "Senha123!", "Nova Conta");

    expect(result).toEqual({
      error:
        "Não foi possível conectar para criar sua conta. Verifique sua internet e tente novamente.",
    });
  });

  it("limpa tokens da barra depois de aplicar o callback no PWA", async () => {
    platform.OS = "web";
    const callbackUrl = `${window.location.origin}/#access_token=segredo&refresh_token=renovacao&type=signup`;
    vi.mocked(Linking.getInitialURL).mockResolvedValue(callbackUrl);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const setSession = vi.spyOn(supabase.auth, "setSession").mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });
    const replaceState = vi.spyOn(window.history, "replaceState");
    useAuth.setState({ isLoading: true });

    await useAuth.getState().initialize();

    expect(setSession).toHaveBeenCalledWith({
      access_token: "segredo",
      refresh_token: "renovacao",
    });
    expect(replaceState).toHaveBeenCalledWith(window.history.state, "", "/");
  });
});
