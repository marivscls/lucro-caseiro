import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { User } from "@supabase/supabase-js";
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

  it("mantem o onboarding pendente quando o cadastro exige login depois", async () => {
    const userId = "67e5db17-3f41-46ee-9dbd-9df536cf3d2c";
    const user = {
      id: userId,
      identities: [{ id: "email-identity" }],
    } as User;
    vi.spyOn(supabase.auth, "signUp").mockResolvedValue({
      data: { user, session: null },
      error: null,
    });
    useOnboarding.setState({ pendingUserIds: [] });

    const result = await useAuth
      .getState()
      .signUpWithEmail("nova@conta.com", "Senha123!", "Nova Conta");

    expect(result).toEqual({ needsConfirmation: true });
    expect(useOnboarding.getState().pendingUserIds).toContain(userId);
  });
});
