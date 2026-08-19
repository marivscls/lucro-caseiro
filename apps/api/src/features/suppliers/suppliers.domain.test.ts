import { describe, expect, it } from "vitest";

import { monthlySupplierPurchaseSummary, validateSupplierData } from "./suppliers.domain";
import type { CreateSupplierData } from "./suppliers.types";

function makeData(overrides: Partial<CreateSupplierData> = {}): CreateSupplierData {
  return {
    name: "Atacadão da Festa",
    ...overrides,
  };
}

describe("validateSupplierData", () => {
  it("returns no errors for valid data", () => {
    expect(validateSupplierData(makeData())).toEqual([]);
  });

  it("requires a non-empty name", () => {
    expect(validateSupplierData(makeData({ name: "   " }))).toContain(
      "Nome do fornecedor é obrigatório",
    );
  });

  it("rejects a name longer than 200 chars", () => {
    expect(validateSupplierData(makeData({ name: "a".repeat(201) }))).toContain(
      "Nome do fornecedor deve ter no máximo 200 caracteres",
    );
  });

  it("rejects a one-character name", () => {
    expect(validateSupplierData(makeData({ name: "A" }))).toContain(
      "Nome do fornecedor deve ter pelo menos 2 caracteres",
    );
  });

  it("accepts a valid phone", () => {
    expect(validateSupplierData(makeData({ phone: "11999998888" }))).toEqual([]);
  });

  it("rejects a phone with too few digits", () => {
    expect(validateSupplierData(makeData({ phone: "1199" }))).toContain(
      "Telefone brasileiro deve ter DDD e 10 ou 11 dígitos",
    );
  });

  it("ignores an empty phone string", () => {
    expect(validateSupplierData(makeData({ phone: "" }))).toEqual([]);
  });

  it("accepts a valid email", () => {
    expect(validateSupplierData(makeData({ email: "contato@atacadao.com" }))).toEqual([]);
  });

  it("rejects an invalid email", () => {
    expect(validateSupplierData(makeData({ email: "contato-arroba" }))).toContain(
      "Email inválido",
    );
  });

  it("ignores an empty email string", () => {
    expect(validateSupplierData(makeData({ email: "" }))).toEqual([]);
  });
});

describe("monthlySupplierPurchaseSummary", () => {
  it("sums only the current month and counts distinct suppliers", () => {
    const summary = monthlySupplierPurchaseSummary(
      [
        { purchasedAt: "2026-08-01", amount: "100.10", supplierId: "a" },
        { purchasedAt: "2026-08-18", amount: "42.90", supplierId: "a" },
        { purchasedAt: "2026-08-10", amount: 50, supplierId: "b" },
        { purchasedAt: "2026-07-31", amount: 999, supplierId: "c" },
      ],
      new Date("2026-08-18T12:00:00.000Z"),
    );
    expect(summary).toEqual({ totalAmount: 193, purchaseCount: 3, supplierCount: 2 });
  });

  it("returns a coherent zero state", () => {
    expect(
      monthlySupplierPurchaseSummary([], new Date("2026-08-18T12:00:00.000Z")),
    ).toEqual({ totalAmount: 0, purchaseCount: 0, supplierCount: 0 });
  });
});
