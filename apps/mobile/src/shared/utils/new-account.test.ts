import { describe, expect, it } from "vitest";

import { NEW_ACCOUNT_WINDOW_MS, isNewAccount } from "./new-account";

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
