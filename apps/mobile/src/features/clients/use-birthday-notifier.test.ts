import { describe, expect, it } from "vitest";

import { isBirthdayToday } from "./use-birthday-notifier";

describe("isBirthdayToday", () => {
  const today = new Date(2026, 5, 15); // 15/06/2026 (mês 0-based: 5 = junho)

  it("casa dia e mês ignorando o ano", () => {
    expect(isBirthdayToday("1990-06-15", today)).toBe(true);
  });

  it("não casa quando o dia difere", () => {
    expect(isBirthdayToday("1990-06-14", today)).toBe(false);
  });

  it("não casa quando o mês difere", () => {
    expect(isBirthdayToday("1990-07-15", today)).toBe(false);
  });

  it("aceita data com horário (ISO completo)", () => {
    expect(isBirthdayToday("1990-06-15T00:00:00.000Z", today)).toBe(true);
  });

  it("retorna false para nulo/vazio", () => {
    expect(isBirthdayToday(null, today)).toBe(false);
    expect(isBirthdayToday("", today)).toBe(false);
  });
});
