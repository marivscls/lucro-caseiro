import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockSupabase, nameFromEmail, tokenForUser, userIdFromToken } from "./auth";
import { loadDemoData } from "./db";
import { clearMockMemory } from "./storage";

// Qualquer senha é aceita na demonstração.
const ANY_SECRET = ["demo", "1234"].join("-");

beforeEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  clearMockMemory();
});

describe("auth da demonstração", () => {
  it("deriva um nome amigável do e-mail", () => {
    expect(nameFromEmail("ana.souza@exemplo.com")).toBe("Ana Souza");
    expect(nameFromEmail("123@exemplo.com")).toBe("Visitante");
  });

  it("recupera a conta a partir do token", () => {
    expect(userIdFromToken(tokenForUser("abc"))).toBe("abc");
    expect(userIdFromToken("Bearer real-jwt")).toBeNull();
  });

  it("cadastro abre sessão de conta nova sem dados", async () => {
    // Arrange
    const auth = mockSupabase.auth;

    // Act
    const { data, error } = await auth.signUp({
      email: "Lucas@Exemplo.com",
      password: ANY_SECRET,
      options: { data: { name: "Lucas", onboarding_completed: false } },
    });
    const session = (await auth.getSession()).data.session;

    // Assert
    expect(error).toBeNull();
    expect(session?.user.email).toBe("lucas@exemplo.com");
    expect(data.user.identities).toHaveLength(1);
    expect(data.user.user_metadata.onboarding_completed).toBe(false);
    expect(loadDemoData(data.user.id)?.sales).toEqual([]);
  });

  it("entrar com e-mail desconhecido abre a confeitaria de exemplo", async () => {
    // Arrange
    const auth = mockSupabase.auth;

    // Act
    const { data } = await auth.signInWithPassword({
      email: "dona@exemplo.com",
      password: ANY_SECRET,
    });

    // Assert
    expect(data.user.user_metadata.onboarding_completed).toBe(true);
    expect(loadDemoData(data.user.id)?.profile.businessName).toBe("Doces da Ana");
    expect(loadDemoData(data.user.id)?.sales.length).toBeGreaterThan(0);
  });

  it("atualiza metadata e encerra a sessão ao sair", async () => {
    // Arrange
    const auth = mockSupabase.auth;
    await auth.signUp({ email: "a@b.com", password: ANY_SECRET });

    // Act
    const updated = await auth.updateUser({ data: { onboarding_completed: true } });
    await auth.signOut({ scope: "local" });

    // Assert
    expect(updated.data.user?.user_metadata.onboarding_completed).toBe(true);
    expect((await auth.getSession()).data.session).toBeNull();
    expect((await auth.getUser()).error).not.toBeNull();
  });

  it("Google entra na mesma conta de demonstração", async () => {
    // Arrange
    const auth = mockSupabase.auth;

    // Act
    const first = await auth.signInWithOAuth({ provider: "google" });
    const firstId = (await auth.getSession()).data.session?.user.id;
    await auth.signOut();
    await auth.signInWithOAuth({ provider: "google" });
    const secondId = (await auth.getSession()).data.session?.user.id;

    // Assert
    expect(first.error).toBeNull();
    expect(firstId).toBeTruthy();
    expect(secondId).toBe(firstId);
  });
});
