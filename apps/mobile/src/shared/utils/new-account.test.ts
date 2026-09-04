import { describe, expect, it } from "vitest";

import {
  NEW_ACCOUNT_WINDOW_MS,
  isNewAccount,
  needsOnboarding,
  onboardingDestination,
} from "./new-account";

describe("isNewAccount", () => {
  const now = new Date("2026-07-11T12:00:00.000Z").getTime();

  it("considera nova a conta criada agora (cadastro recente)", () => {
    const createdAt = new Date(now - 30 * 1000).toISOString(); // 30s atrás
    expect(isNewAccount(createdAt, now)).toBe(true);
  });

  it("considera nova dentro da janela", () => {
    const createdAt = new Date(now - (NEW_ACCOUNT_WINDOW_MS - 1000)).toISOString();
    expect(isNewAccount(createdAt, now)).toBe(true);
  });

  it("NAO considera nova uma conta antiga (usuario retornando)", () => {
    const createdAt = new Date(now - 60 * 60 * 1000).toISOString(); // 1h atrás
    expect(isNewAccount(createdAt, now)).toBe(false);
  });

  it("NAO considera nova conta criada ha dias", () => {
    const createdAt = new Date("2026-07-01T12:00:00.000Z").toISOString();
    expect(isNewAccount(createdAt, now)).toBe(false);
  });

  it("na duvida retorna false (sem data ou data invalida)", () => {
    expect(isNewAccount(undefined, now)).toBe(false);
    expect(isNewAccount(null, now)).toBe(false);
    expect(isNewAccount("", now)).toBe(false);
    expect(isNewAccount("nao-e-data", now)).toBe(false);
  });
});

describe("needsOnboarding", () => {
  const now = new Date("2026-07-11T12:00:00.000Z").getTime();

  it("mantem o onboarding pendente depois da confirmacao e do login", () => {
    const oldCreatedAt = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    expect(needsOnboarding("user-new", oldCreatedAt, ["user-new"], now)).toBe(true);
  });

  it("nao confunde outra conta do aparelho com a conta recem-criada", () => {
    const oldCreatedAt = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    expect(needsOnboarding("user-old", oldCreatedAt, ["user-new"], now)).toBe(false);
  });

  it("mantem onboarding para cadastro marcado como pendente no servidor", () => {
    const oldCreatedAt = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    expect(needsOnboarding("user-new", oldCreatedAt, [], now, false)).toBe(true);
  });

  it("nao repete onboarding concluido mesmo para conta recente", () => {
    const recentCreatedAt = new Date(now - 30 * 1000).toISOString();

    expect(needsOnboarding("user-new", recentCreatedAt, ["user-new"], now, true)).toBe(
      false,
    );
  });
});

describe("onboardingDestination", () => {
  const now = new Date("2026-07-11T12:00:00.000Z").getTime();
  const oldCreatedAt = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  it("prioriza a pendencia persistida da conta sobre conclusao local antiga", () => {
    expect(
      onboardingDestination({
        userId: "new-user",
        createdAt: oldCreatedAt,
        pendingUserIds: [],
        completed: true,
        completedUserIds: ["old-user"],
        onboardingCompleted: false,
        now,
      }),
    ).toBe("/onboarding");
  });

  it("envia conta Google recem-criada sem metadata para o onboarding", () => {
    expect(
      onboardingDestination({
        userId: "google-user",
        createdAt: new Date(now - 30 * 1000).toISOString(),
        pendingUserIds: [],
        completed: false,
        completedUserIds: [],
        now,
      }),
    ).toBe("/onboarding");
  });

  it("libera conta marcada como concluida no servidor", () => {
    expect(
      onboardingDestination({
        userId: "returning-user",
        createdAt: oldCreatedAt,
        pendingUserIds: ["returning-user"],
        completed: false,
        completedUserIds: [],
        onboardingCompleted: true,
        now,
      }),
    ).toBe("/tabs");
  });

  it("nao reabre onboarding se esta conta ja concluiu neste aparelho", () => {
    expect(
      onboardingDestination({
        userId: "returning-user",
        createdAt: oldCreatedAt,
        pendingUserIds: [],
        completed: false,
        completedUserIds: ["returning-user"],
        onboardingCompleted: false,
        now,
      }),
    ).toBe("/tabs");
  });

  it("deixa conta legada sem sinais para a verificacao de perfil", () => {
    expect(
      onboardingDestination({
        userId: "legacy-user",
        createdAt: oldCreatedAt,
        pendingUserIds: [],
        completed: false,
        completedUserIds: [],
        now,
      }),
    ).toBeNull();
  });
});
