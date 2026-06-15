import { describe, expect, it } from "vitest";

import { countByType, profit, profitDeltaPct } from "./calc";

describe("profit", () => {
  it("e receitas menos despesas", () => {
    expect(profit(0, 0)).toBe(0);
    expect(profit(100, 0)).toBe(100);
    expect(profit(0, 50)).toBe(-50); // saldo negativo
    expect(profit(100.5, 50.25)).toBeCloseTo(50.25, 2);
  });
});

describe("profitDeltaPct", () => {
  it("retorna null quando o lucro anterior e zero (sem base / evita /0)", () => {
    expect(profitDeltaPct(50, 0)).toBeNull();
  });

  it("calcula a variacao percentual arredondada", () => {
    expect(profitDeltaPct(100, 50)).toBe(100); // +100%
    expect(profitDeltaPct(50, 100)).toBe(-50); // -50%
  });

  it("usa o modulo do anterior (lucro anterior negativo)", () => {
    // (50 - (-100)) / |−100| * 100 = 150
    expect(profitDeltaPct(50, -100)).toBe(150);
  });
});

describe("countByType", () => {
  it("conta zero para lista vazia", () => {
    expect(countByType([])).toEqual({ incomeCount: 0, expenseCount: 0 });
  });

  it("conta receitas e despesas", () => {
    expect(
      countByType([
        { type: "income" },
        { type: "income" },
        { type: "expense" },
        { type: "other" },
      ]),
    ).toEqual({ incomeCount: 2, expenseCount: 1 });
  });
});
