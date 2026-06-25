import { describe, expect, it } from "vitest";

import { todayIso, validatePurchaseData } from "./purchases.domain";
import type { CreatePurchaseData } from "./purchases.types";

function makeData(overrides: Partial<CreatePurchaseData> = {}): CreatePurchaseData {
  return {
    description: "Farinha 25kg",
    amount: 120,
    purchasedAt: "2026-06-25",
    ...overrides,
  };
}

describe("validatePurchaseData", () => {
  it("returns no errors for valid data", () => {
    expect(validatePurchaseData(makeData())).toEqual([]);
  });

  it("requires a description", () => {
    expect(validatePurchaseData(makeData({ description: "  " }))).toContain(
      "Descrição é obrigatória",
    );
  });

  it("rejects amount <= 0", () => {
    expect(validatePurchaseData(makeData({ amount: 0 }))).toContain(
      "Valor deve ser maior que zero",
    );
  });

  it("rejects an invalid purchase date", () => {
    expect(validatePurchaseData(makeData({ purchasedAt: "25/06/2026" }))).toContain(
      "Data da compra inválida",
    );
  });

  it("rejects an invalid due date when present", () => {
    expect(validatePurchaseData(makeData({ dueDate: "soon" }))).toContain(
      "Data de vencimento inválida",
    );
  });

  it("accepts a null due date", () => {
    expect(validatePurchaseData(makeData({ dueDate: null }))).toEqual([]);
  });
});

describe("todayIso", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayIso(new Date("2026-06-25T15:30:00Z"))).toBe("2026-06-25");
  });
});
