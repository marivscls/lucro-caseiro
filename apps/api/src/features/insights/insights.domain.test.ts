import { describe, expect, it } from "vitest";

import { clampMonths, monthKeys, startOfRange } from "./insights.domain";

describe("clampMonths", () => {
  it("usa 6 como default quando ausente", () => {
    expect(clampMonths(undefined)).toBe(6);
    expect(clampMonths(NaN)).toBe(6);
  });

  it("limita entre 1 e 12", () => {
    expect(clampMonths(0)).toBe(1);
    expect(clampMonths(-3)).toBe(1);
    expect(clampMonths(99)).toBe(12);
  });

  it("trunca valores fracionados", () => {
    expect(clampMonths(3.9)).toBe(3);
  });
});

describe("monthKeys", () => {
  it("gera N chaves do mais antigo ao mais recente", () => {
    const now = new Date(Date.UTC(2026, 4, 15)); // maio/2026
    expect(monthKeys(now, 3)).toEqual(["2026-03", "2026-04", "2026-05"]);
  });

  it("atravessa a virada de ano", () => {
    const now = new Date(Date.UTC(2026, 1, 10)); // fev/2026
    expect(monthKeys(now, 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("startOfRange", () => {
  it("retorna o primeiro dia do mês inicial da janela", () => {
    const now = new Date(Date.UTC(2026, 4, 15));
    expect(startOfRange(now, 3).toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("janela de 1 mês começa no mês corrente", () => {
    const now = new Date(Date.UTC(2026, 4, 31));
    expect(startOfRange(now, 1).toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });
});
