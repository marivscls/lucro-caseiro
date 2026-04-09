import { describe, expect, it } from "vitest";

import {
  buildDaySummary,
  calculateSaleTotal,
  canCancelSale,
  validateSaleItems,
} from "./sales.domain";
import type { SaleItemData } from "./sales.types";

function makeItem(overrides: Partial<SaleItemData> = {}): SaleItemData {
  return {
    productId: "prod-1",
    quantity: 2,
    unitPrice: 10,
    ...overrides,
  };
}

describe("calculateSaleTotal", () => {
  it("calculates total from single item", () => {
    const total = calculateSaleTotal([makeItem({ quantity: 3, unitPrice: 5 })]);
    expect(total).toBe(15);
  });

  it("calculates total from multiple items", () => {
    const total = calculateSaleTotal([
      makeItem({ quantity: 2, unitPrice: 10 }),
      makeItem({ quantity: 1, unitPrice: 25 }),
    ]);
    expect(total).toBe(45);
  });

  it("returns 0 for empty items", () => {
    const total = calculateSaleTotal([]);
    expect(total).toBe(0);
  });
});

describe("validateSaleItems", () => {
  it("returns empty array for valid items", () => {
    const errors = validateSaleItems([makeItem()]);
    expect(errors).toEqual([]);
  });

  it("rejects empty items array", () => {
    const errors = validateSaleItems([]);
    expect(errors).toContain("Itens da venda sao obrigatorios");
  });

  it("rejects zero quantity", () => {
    const errors = validateSaleItems([makeItem({ quantity: 0 })]);
    expect(errors).toContain("Item 1: quantidade deve ser maior que zero");
  });

  it("rejects negative quantity", () => {
    const errors = validateSaleItems([makeItem({ quantity: -1 })]);
    expect(errors).toContain("Item 1: quantidade deve ser maior que zero");
  });

  it("rejects zero unit price", () => {
    const errors = validateSaleItems([makeItem({ unitPrice: 0 })]);
    expect(errors).toContain("Item 1: preco unitario deve ser maior que zero");
  });

  it("rejects negative unit price", () => {
    const errors = validateSaleItems([makeItem({ unitPrice: -5 })]);
    expect(errors).toContain("Item 1: preco unitario deve ser maior que zero");
  });

  it("accumulates errors across multiple items", () => {
    const errors = validateSaleItems([
      makeItem({ quantity: 0 }),
      makeItem({ unitPrice: -1 }),
    ]);
    expect(errors).toContain("Item 1: quantidade deve ser maior que zero");
    expect(errors).toContain("Item 2: preco unitario deve ser maior que zero");
  });

  it("accumulates multiple errors for same item", () => {
    const errors = validateSaleItems([makeItem({ quantity: 0, unitPrice: 0 })]);
    expect(errors.length).toBe(2);
  });
});

describe("canCancelSale", () => {
  it("allows cancelling a pending sale", () => {
    expect(canCancelSale("pending")).toBe(true);
  });

  it("allows cancelling a paid sale", () => {
    expect(canCancelSale("paid")).toBe(true);
  });

  it("does not allow cancelling an already cancelled sale", () => {
    expect(canCancelSale("cancelled")).toBe(false);
  });
});

describe("buildDaySummary", () => {
  it("builds summary with sales", () => {
    const summary = buildDaySummary(10, 500);
    expect(summary).toEqual({
      totalSales: 10,
      totalAmount: 500,
      averageTicket: 50,
    });
  });

  it("returns zero average ticket when no sales", () => {
    const summary = buildDaySummary(0, 0);
    expect(summary).toEqual({
      totalSales: 0,
      totalAmount: 0,
      averageTicket: 0,
    });
  });
});
