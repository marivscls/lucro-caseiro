import type { Material } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  buildShoppingList,
  currentStockLabel,
  formatCost,
  formatQty,
  groupShoppingListItems,
  isLowStock,
  stockBadge,
} from "./domain";

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: "m",
    userId: "u",
    name: "Farinha",
    unit: "kg",
    stockQuantity: 10,
    stockAlertThreshold: 3,
    costPerUnit: null,
    contentPerUnit: null,
    contentUnit: null,
    notes: null,
    icon: null,
    supplierId: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("stockBadge", () => {
  it("flags zero as 'Sem estoque'", () => {
    expect(stockBadge(makeMaterial({ stockQuantity: 0 })).tone).toBe("danger");
  });

  it("flags low stock and shows the alert threshold", () => {
    const badge = stockBadge(
      makeMaterial({ stockQuantity: 0.8, stockAlertThreshold: 1, unit: "kg" }),
    );
    expect(badge.tone).toBe("warn");
    expect(badge.label).toBe("Baixo • 1 kg");
  });

  it("shows quantity + unit when ok", () => {
    const badge = stockBadge(makeMaterial({ stockQuantity: 10, unit: "kg" }));
    expect(badge.tone).toBe("success");
    expect(badge.label).toBe("10 kg");
  });
});

describe("isLowStock", () => {
  it("true quando abaixo do limite, false sem limite", () => {
    expect(isLowStock(makeMaterial({ stockQuantity: 1.2, stockAlertThreshold: 5 }))).toBe(
      true,
    );
    expect(isLowStock(makeMaterial({ stockQuantity: 10, stockAlertThreshold: 3 }))).toBe(
      false,
    );
    expect(isLowStock(makeMaterial({ stockAlertThreshold: null }))).toBe(false);
  });
});

describe("currentStockLabel", () => {
  it("formata estoque atual com unidade", () => {
    expect(currentStockLabel(makeMaterial({ stockQuantity: 0.8, unit: "kg" }))).toBe(
      "0,8 kg",
    );
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

describe("lista de compras de insumos", () => {
  const flour = makeMaterial({
    id: "flour",
    name: "Farinha",
    stockQuantity: 0,
    stockAlertThreshold: 3,
  });
  const sugar = makeMaterial({
    id: "sugar",
    name: "Açúcar",
    stockQuantity: 1.5,
    stockAlertThreshold: 2,
  });

  it("separa itens sem estoque dos itens com estoque baixo", () => {
    expect(groupShoppingListItems([sugar, flour])).toEqual({
      outOfStock: [flour],
      lowStock: [sugar],
    });
  });

  it("inclui estoque atual e mínimo no texto compartilhado", () => {
    expect(buildShoppingList([sugar, flour])).toBe(
      [
        "🛒 Lista de compras de insumos",
        "",
        "SEM ESTOQUE",
        "• Farinha — atual: 0 kg · mínimo: 3 kg",
        "",
        "ESTOQUE BAIXO",
        "• Açúcar — atual: 1,5 kg · mínimo: 2 kg",
      ].join("\n"),
    );
  });
});
