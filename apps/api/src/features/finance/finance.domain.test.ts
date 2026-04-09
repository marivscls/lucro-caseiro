import { describe, expect, it } from "vitest";

import type { FinanceEntry } from "@lucro-caseiro/contracts";

import {
  calculateProfit,
  formatCurrency,
  groupByCategory,
  validateFinanceEntry,
} from "./finance.domain";
import type { CreateFinanceEntryData } from "./finance.types";

function makeEntryData(
  overrides: Partial<CreateFinanceEntryData> = {},
): CreateFinanceEntryData {
  return {
    type: "expense",
    category: "material",
    amount: 50,
    description: "Compra de farinha",
    date: "2026-03-15",
    ...overrides,
  };
}

function makeFinanceEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id: "entry-1",
    userId: "user-123",
    type: "expense",
    category: "material",
    amount: 50,
    description: "Compra de farinha",
    saleId: null,
    date: "2026-03-15",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("calculateProfit", () => {
  it("returns positive profit when income exceeds expenses", () => {
    expect(calculateProfit(1000, 600)).toBe(400);
  });

  it("returns negative profit when expenses exceed income", () => {
    expect(calculateProfit(500, 800)).toBe(-300);
  });

  it("returns zero when income equals expenses", () => {
    expect(calculateProfit(500, 500)).toBe(0);
  });
});

describe("validateFinanceEntry", () => {
  it("returns empty array for valid data", () => {
    const errors = validateFinanceEntry(makeEntryData());
    expect(errors).toEqual([]);
  });

  it("rejects zero amount", () => {
    const errors = validateFinanceEntry(makeEntryData({ amount: 0 }));
    expect(errors).toContain("Valor deve ser maior que zero");
  });

  it("rejects negative amount", () => {
    const errors = validateFinanceEntry(makeEntryData({ amount: -10 }));
    expect(errors).toContain("Valor deve ser maior que zero");
  });

  it("rejects empty description", () => {
    const errors = validateFinanceEntry(makeEntryData({ description: "   " }));
    expect(errors).toContain("Descricao e obrigatoria");
  });

  it("rejects description over 500 chars", () => {
    const errors = validateFinanceEntry(makeEntryData({ description: "a".repeat(501) }));
    expect(errors).toContain("Descricao deve ter no maximo 500 caracteres");
  });

  it("rejects invalid date format", () => {
    const errors = validateFinanceEntry(makeEntryData({ date: "15/03/2026" }));
    expect(errors).toContain("Data invalida");
  });

  it("rejects empty date", () => {
    const errors = validateFinanceEntry(makeEntryData({ date: "" }));
    expect(errors).toContain("Data invalida");
  });

  it("accumulates multiple errors", () => {
    const errors = validateFinanceEntry(
      makeEntryData({ amount: -1, description: "", date: "invalid" }),
    );
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("formatCurrency", () => {
  it("formats integer value", () => {
    expect(formatCurrency(100)).toBe("R$ 100,00");
  });

  it("formats decimal value", () => {
    expect(formatCurrency(49.9)).toBe("R$ 49,90");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });

  it("formats large value", () => {
    expect(formatCurrency(1234.56)).toBe("R$ 1234,56");
  });
});

describe("groupByCategory", () => {
  it("groups entries by category", () => {
    const entries = [
      makeFinanceEntry({ category: "material", id: "e1" }),
      makeFinanceEntry({ category: "transport", id: "e2" }),
      makeFinanceEntry({ category: "material", id: "e3" }),
    ];

    const grouped = groupByCategory(entries);

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["material"]).toHaveLength(2);
    expect(grouped["transport"]).toHaveLength(1);
  });

  it("returns empty object for empty array", () => {
    const grouped = groupByCategory([]);
    expect(grouped).toEqual({});
  });

  it("handles single category", () => {
    const entries = [
      makeFinanceEntry({ category: "fee", id: "e1" }),
      makeFinanceEntry({ category: "fee", id: "e2" }),
    ];

    const grouped = groupByCategory(entries);

    expect(Object.keys(grouped)).toHaveLength(1);
    expect(grouped["fee"]).toHaveLength(2);
  });
});
