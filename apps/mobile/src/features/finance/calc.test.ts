import { describe, expect, it } from "vitest";

import {
  countByType,
  entryBalance,
  financePeriodRange,
  orderReceiptProgress,
  profit,
  profitDeltaPct,
  totalsByType,
  unusualExpenses,
} from "./calc";

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

describe("financePeriodRange", () => {
  const today = new Date(2026, 6, 24, 12);

  it("monta hoje e os últimos 7 dias como intervalos inclusivos", () => {
    expect(financePeriodRange("today", 7, 2026, today)).toEqual({
      startDate: "2026-07-24",
      endDate: "2026-07-24",
    });
    expect(financePeriodRange("7days", 7, 2026, today)).toEqual({
      startDate: "2026-07-18",
      endDate: "2026-07-24",
    });
  });

  it("respeita o mês escolhido, inclusive ano bissexto", () => {
    expect(financePeriodRange("month", 2, 2024, today)).toEqual({
      startDate: "2024-02-01",
      endDate: "2024-02-29",
    });
  });
});

describe("totalsByType", () => {
  it("soma entradas e saídas sem misturar outros tipos", () => {
    expect(
      totalsByType([
        { type: "income", amount: 120 },
        { type: "expense", amount: 35 },
        { type: "income", amount: 20 },
        { type: "other", amount: 999 },
      ]),
    ).toEqual({ income: 140, expenses: 35 });
  });
});

describe("orderReceiptProgress", () => {
  it("calcula o percentual recebido e protege total vazio", () => {
    expect(orderReceiptProgress(5_097.5, 2_907.5)).toBe(64);
    expect(orderReceiptProgress(0, 0)).toBe(0);
  });
});

describe("entryBalance", () => {
  it("calcula o saldo diário com o sinal financeiro correto", () => {
    expect(
      entryBalance([
        { type: "expense", amount: 120 },
        { type: "income", amount: 8.5 },
        { type: "expense", amount: 120 },
      ]),
    ).toBe(-231.5);
  });
});

describe("unusualExpenses", () => {
  it("sÃ³ sinaliza com base suficiente e valor de ao menos 2x a mediana", () => {
    const entries = [
      { id: "1", type: "expense", amount: 10 },
      { id: "2", type: "expense", amount: 12 },
      { id: "3", type: "expense", amount: 14 },
      { id: "4", type: "expense", amount: 80 },
    ];
    expect(unusualExpenses(entries).map((entry) => entry.id)).toEqual(["4"]);
    expect(unusualExpenses(entries.slice(0, 3))).toEqual([]);
  });
});
