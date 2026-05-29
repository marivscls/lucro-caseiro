import type { Material } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { formatCost, formatQty, stockBadge } from "./domain";

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: "m",
    userId: "u",
    name: "Farinha",
    unit: "kg",
    stockQuantity: 10,
    stockAlertThreshold: 3,
    costPerUnit: null,
    notes: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("stockBadge", () => {
  it("flags zero as 'Sem estoque'", () => {
    expect(stockBadge(makeMaterial({ stockQuantity: 0 })).tone).toBe("danger");
  });

  it("flags low stock and shows remaining quantity", () => {
    const badge = stockBadge(
      makeMaterial({ stockQuantity: 2, stockAlertThreshold: 3, unit: "kg" }),
    );
    expect(badge.tone).toBe("warn");
    expect(badge.label).toBe("Baixo · 2 kg");
  });

  it("shows quantity + unit when ok", () => {
    const badge = stockBadge(makeMaterial({ stockQuantity: 10, unit: "kg" }));
    expect(badge.tone).toBe("success");
    expect(badge.label).toBe("10 kg");
  });
});

describe("formatQty", () => {
  it("keeps integers and uses comma for decimals", () => {
    expect(formatQty(10)).toBe("10");
    expect(formatQty(2.5)).toBe("2,5");
  });
});

describe("formatCost", () => {
  it("formats currency per unit", () => {
    expect(formatCost(4.5, "kg")).toBe("R$ 4,50/kg");
  });
});
