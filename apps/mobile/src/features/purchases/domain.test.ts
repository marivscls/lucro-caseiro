import type { Purchase } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  categoryLabel,
  formatPurchaseItemsLine,
  normalizePurchase,
  pendingCountLabel,
  pendingTotal,
  purchaseFilterCounts,
  sortPurchasesMostRecentFirst,
  sortPurchasesPendingFirst,
  type PurchasePayload,
} from "./domain";

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: "p",
    userId: "u",
    supplierId: null,
    description: "Farinha",
    amount: 100,
    items: [],
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

describe("normalizePurchase", () => {
  it("fills items for responses from the API version before purchase items", () => {
    const legacyPurchase: PurchasePayload = { ...makePurchase() };
    delete legacyPurchase.items;

    expect(normalizePurchase(legacyPurchase).items).toEqual([]);
  });

  it("preserves items returned by the current API", () => {
    const items: Purchase["items"] = [
      {
        id: "item",
        productId: "product",
        productName: "Caderno",
        variationId: null,
        variationName: null,
        quantity: 2,
        unitCost: 10,
        subtotal: 20,
      },
    ];

    expect(normalizePurchase(makePurchase({ items })).items).toBe(items);
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

describe("pendingCountLabel", () => {
  it("uses singular and plural in Portuguese", () => {
    expect(pendingCountLabel(0)).toBe("0 compras pendentes");
    expect(pendingCountLabel(1)).toBe("1 compra pendente");
    expect(pendingCountLabel(4)).toBe("4 compras pendentes");
  });
});

describe("purchaseFilterCounts", () => {
  it("counts all, pending and paid purchases", () => {
    const items = [
      makePurchase({ id: "1", paymentStatus: "pending" }),
      makePurchase({ id: "2", paymentStatus: "pending" }),
      makePurchase({ id: "3", paymentStatus: "paid" }),
    ];
    expect(purchaseFilterCounts(items)).toEqual({ all: 3, pending: 2, paid: 1 });
  });
});

describe("sortPurchasesMostRecentFirst", () => {
  it("orders by purchasedAt and then createdAt, newest first", () => {
    const items = [
      makePurchase({
        id: "old",
        purchasedAt: "2026-08-10",
        createdAt: "2026-08-10T10:00:00.000Z",
      }),
      makePurchase({
        id: "newer-same-day",
        purchasedAt: "2026-08-14",
        createdAt: "2026-08-14T18:00:00.000Z",
      }),
      makePurchase({
        id: "newer-earlier",
        purchasedAt: "2026-08-14",
        createdAt: "2026-08-14T08:00:00.000Z",
      }),
    ];

    expect(sortPurchasesMostRecentFirst(items).map((purchase) => purchase.id)).toEqual([
      "newer-same-day",
      "newer-earlier",
      "old",
    ]);
  });
});

describe("formatPurchaseItemsLine", () => {
  it("joins visible product names without technical prefixes", () => {
    const items: Purchase["items"] = [
      {
        id: "item-1",
        productId: "product",
        productName: "[massa] Bolo de pote morango",
        variationId: null,
        variationName: null,
        quantity: 2,
        unitCost: 10,
        subtotal: 20,
      },
      {
        id: "item-2",
        productId: "product-2",
        productName: "Brigadeiro",
        variationId: null,
        variationName: "70%",
        quantity: 1,
        unitCost: 8,
        subtotal: 8,
      },
    ];

    expect(formatPurchaseItemsLine(items, (name) => name.replace(/^\[.*?]\s*/, ""))).toBe(
      "2x Bolo de pote morango · 1x Brigadeiro — 70%",
    );
  });
});

describe("sortPurchasesPendingFirst", () => {
  it("moves pending purchases above paid purchases and keeps group order", () => {
    const items = [
      makePurchase({ id: "paid-1", paymentStatus: "paid" }),
      makePurchase({ id: "pending-1", paymentStatus: "pending" }),
      makePurchase({ id: "paid-2", paymentStatus: "paid" }),
      makePurchase({ id: "pending-2", paymentStatus: "pending" }),
    ];

    expect(sortPurchasesPendingFirst(items).map((purchase) => purchase.id)).toEqual([
      "pending-1",
      "pending-2",
      "paid-1",
      "paid-2",
    ]);
    expect(items.map((purchase) => purchase.id)).toEqual([
      "paid-1",
      "pending-1",
      "paid-2",
      "pending-2",
    ]);
  });
});
