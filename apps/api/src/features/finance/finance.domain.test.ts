import { describe, expect, it } from "vitest";

import type { FinanceEntry } from "@lucro-caseiro/contracts";

import {
  calculateProfit,
  clampToWeek,
  currentBrazilMonth,
  currentWeekRange,
  isCurrentBrazilMonth,
  formatCurrency,
  groupByCategory,
  recurringEntryDate,
  validateFinanceEntry,
  validateRecurringExpense,
} from "./finance.domain";
import type { CreateFinanceEntryData } from "./finance.types";

describe("validateRecurringExpense", () => {
  const valid = { amount: 800, description: "Aluguel", dayOfMonth: 5 };

  it("aceita dados válidos", () => {
    expect(validateRecurringExpense(valid)).toEqual([]);
  });

  it("rejeita valor <= 0", () => {
    expect(validateRecurringExpense({ ...valid, amount: 0 })).toContain(
      "Valor deve ser maior que zero",
    );
  });

  it("rejeita descrição vazia", () => {
    expect(validateRecurringExpense({ ...valid, description: "  " })).toContain(
      "Descrição é obrigatória",
    );
  });

  it("rejeita dia fora de 1–28", () => {
    expect(validateRecurringExpense({ ...valid, dayOfMonth: 0 }).length).toBeGreaterThan(
      0,
    );
    expect(validateRecurringExpense({ ...valid, dayOfMonth: 31 }).length).toBeGreaterThan(
      0,
    );
  });
});

describe("recurringEntryDate", () => {
  it("monta a data YYYY-MM-DD com o dia do mês", () => {
    expect(recurringEntryDate(2026, 6, 5)).toBe("2026-06-05");
  });

  it("limita o dia ao tamanho do mês", () => {
    // Fevereiro de 2026 tem 28 dias; dia 30 cai no 28.
    expect(recurringEntryDate(2026, 2, 28)).toBe("2026-02-28");
  });
});

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
    isFixed: false,
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
    expect(errors).toContain("Descrição é obrigatória");
  });

  it("rejects description over 500 chars", () => {
    const errors = validateFinanceEntry(makeEntryData({ description: "a".repeat(501) }));
    expect(errors).toContain("Descrição deve ter no máximo 500 caracteres");
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

describe("currentWeekRange (horário de Brasília)", () => {
  it("returns Monday to Sunday for a mid-week day", () => {
    // Arrange: quarta-feira, 11/11/2026, 15:00 em Brasília
    const now = new Date("2026-11-11T18:00:00Z");

    // Act
    const week = currentWeekRange(now);

    // Assert
    expect(week).toEqual({ startDate: "2026-11-09", endDate: "2026-11-15" });
  });

  it("keeps Sunday late evening in Brasília inside the same week", () => {
    // Arrange: domingo 15/11 23:30 em Brasília = segunda 16/11 02:30 UTC
    const now = new Date("2026-11-16T02:30:00Z");

    // Act
    const week = currentWeekRange(now);

    // Assert
    expect(week).toEqual({ startDate: "2026-11-09", endDate: "2026-11-15" });
  });

  it("starts a new week on Monday 00:00 in Brasília", () => {
    // Arrange: segunda 16/11 00:00 em Brasília
    const now = new Date("2026-11-16T03:00:00Z");

    // Act
    const week = currentWeekRange(now);

    // Assert
    expect(week).toEqual({ startDate: "2026-11-16", endDate: "2026-11-22" });
  });

  it("crosses month and year boundaries", () => {
    // Arrange: quinta 31/12/2026
    const now = new Date("2026-12-31T15:00:00Z");

    // Act
    const week = currentWeekRange(now);

    // Assert
    expect(week).toEqual({ startDate: "2026-12-28", endDate: "2027-01-03" });
  });
});

describe("clampToWeek", () => {
  const week = { startDate: "2026-11-09", endDate: "2026-11-15" };

  it("uses the whole week when no period is given", () => {
    expect(clampToWeek({}, week)).toEqual(week);
  });

  it("raises the start and lowers the end to the week limits", () => {
    expect(clampToWeek({ startDate: "2026-11-01", endDate: "2026-11-30" }, week)).toEqual(
      week,
    );
  });

  it("keeps a period that is already inside the week", () => {
    expect(clampToWeek({ startDate: "2026-11-10", endDate: "2026-11-12" }, week)).toEqual(
      { startDate: "2026-11-10", endDate: "2026-11-12" },
    );
  });

  it("turns a period entirely before the week into an empty range", () => {
    const range = clampToWeek({ startDate: "2026-10-01", endDate: "2026-10-31" }, week);
    expect(range.startDate > range.endDate).toBe(true);
  });
});

describe("currentBrazilMonth / isCurrentBrazilMonth", () => {
  it("uses the Brasília month at the UTC month turn", () => {
    // Arrange: 30/11 22:00 em Brasília = 01/12 01:00 UTC
    const now = new Date("2026-12-01T01:00:00Z");

    // Act / Assert
    expect(currentBrazilMonth(now)).toEqual({ month: 11, year: 2026 });
    expect(isCurrentBrazilMonth(11, 2026, now)).toBe(true);
    expect(isCurrentBrazilMonth(12, 2026, now)).toBe(false);
  });
});
