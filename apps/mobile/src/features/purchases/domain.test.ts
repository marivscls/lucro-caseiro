import type { Purchase } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { categoryLabel, pendingTotal } from "./domain";

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: "p",
    userId: "u",
    supplierId: null,
    description: "Farinha",
    amount: 100,
    category: "material",
    paymentStatus: "pending",
    purchasedAt: "2026-06-25",
    dueDate: null,
    paidAt: null,
    financeEntryId: null,
    createdAt: "2026-06-25T00:00:00.000Z",
    ...overrides,
  };
}

describe("categoryLabel", () => {
  it("maps known categories to PT labels", () => {
    expect(categoryLabel("material")).toBe("Insumo");
    expect(categoryLabel("packaging")).toBe("Embalagem");
  });

  it("falls back to Outro for unknown values", () => {
    expect(categoryLabel("sale")).toBe("Outro");
  });
});

describe("pendingTotal", () => {
  it("sums only pending purchases", () => {
    const items = [
      makePurchase({ amount: 100, paymentStatus: "pending" }),
      makePurchase({ amount: 50, paymentStatus: "paid" }),
      makePurchase({ amount: 30, paymentStatus: "pending" }),
    ];
    expect(pendingTotal(items)).toBe(130);
  });

  it("returns 0 with no pending purchases", () => {
    expect(pendingTotal([makePurchase({ paymentStatus: "paid" })])).toBe(0);
  });
});
