import type { Product, RetailPromotion } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { distributeManualDiscount, quoteRetailLine } from "./retail.domain";

const product = {
  id: "11111111-1111-1111-1111-111111111111",
  userId: "22222222-2222-2222-2222-222222222222",
  name: "Caderno",
  description: null,
  category: "Cadernos",
  photoUrl: null,
  extraPhotos: [],
  code: null,
  salePrice: 10,
  saleUnit: "unit",
  costPrice: 5,
  recipeId: null,
  stockQuantity: 10,
  stockAlertThreshold: 2,
  isComposite: false,
  variations: [],
  isActive: true,
  createdAt: new Date().toISOString(),
} satisfies Product;

function promotion(overrides: Partial<RetailPromotion>): RetailPromotion {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    userId: product.userId,
    name: "Promoção",
    type: "percentage",
    value: 10,
    buyQuantity: null,
    payQuantity: null,
    productId: product.id,
    category: null,
    startsAt: new Date(0).toISOString(),
    endsAt: new Date(8640000000000000).toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("retail pricing", () => {
  it("chooses the best applicable promotion without stacking", () => {
    const line = quoteRetailLine(product, 2, undefined, [
      promotion({ value: 10 }),
      promotion({ id: "44444444-4444-4444-4444-444444444444", type: "fixed", value: 2 }),
    ]);
    expect(line.subtotal).toBe(16);
    expect(line.discount).toBe(4);
  });

  it("calculates buy X pay Y", () => {
    const line = quoteRetailLine(product, 7, undefined, [
      promotion({ type: "buy_x_pay_y", value: 1, buyQuantity: 3, payQuantity: 2 }),
    ]);
    expect(line.subtotal).toBe(50);
  });

  it("distributes a manual discount while keeping positive lines", () => {
    const lines = distributeManualDiscount(
      [
        quoteRetailLine(product, 1, undefined, []),
        quoteRetailLine(product, 1, undefined, []),
      ],
      3,
    );
    expect(lines.reduce((sum, line) => sum + line.subtotal, 0)).toBe(17);
    expect(lines.every((line) => line.unitPrice > 0)).toBe(true);
  });
});
