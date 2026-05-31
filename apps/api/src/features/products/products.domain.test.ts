import { describe, expect, it } from "vitest";

import {
  calculateCompositeCost,
  calculateStockStatus,
  isLowStock,
  validateCompositeComponents,
  validateProductData,
} from "./products.domain";
import type { CreateProductData } from "./products.types";

function makeProductData(overrides: Partial<CreateProductData> = {}): CreateProductData {
  return {
    name: "Brigadeiro",
    category: "doces",
    salePrice: 3.5,
    ...overrides,
  };
}

describe("validateProductData", () => {
  it("returns empty array for valid data", () => {
    const errors = validateProductData(makeProductData());
    expect(errors).toEqual([]);
  });

  it("rejects zero sale price", () => {
    const errors = validateProductData(makeProductData({ salePrice: 0 }));
    expect(errors).toContain("Preço de venda deve ser maior que zero");
  });

  it("rejects negative sale price", () => {
    const errors = validateProductData(makeProductData({ salePrice: -5 }));
    expect(errors).toContain("Preço de venda deve ser maior que zero");
  });

  it("rejects empty name", () => {
    const errors = validateProductData(makeProductData({ name: "   " }));
    expect(errors).toContain("Nome do produto é obrigatório");
  });

  it("rejects name over 200 chars", () => {
    const errors = validateProductData(makeProductData({ name: "a".repeat(201) }));
    expect(errors).toContain("Nome do produto deve ter no máximo 200 caracteres");
  });

  it("rejects negative stock quantity", () => {
    const errors = validateProductData(makeProductData({ stockQuantity: -1 }));
    expect(errors).toContain("Quantidade em estoque não pode ser negativa");
  });

  it("rejects negative stock alert threshold", () => {
    const errors = validateProductData(makeProductData({ stockAlertThreshold: -1 }));
    expect(errors).toContain("Alerta de estoque não pode ser negativo");
  });

  it("accumulates multiple errors", () => {
    const errors = validateProductData(makeProductData({ name: "", salePrice: -1 }));
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("calculateCompositeCost", () => {
  it("returns 0 for empty components", () => {
    expect(calculateCompositeCost([])).toBe(0);
  });

  it("sums componentCost * quantity", () => {
    const cost = calculateCompositeCost([
      { costPrice: 2, quantity: 3 }, // 6
      { costPrice: 1.5, quantity: 2 }, // 3
    ]);
    expect(cost).toBe(9);
  });

  it("treats null costPrice as 0", () => {
    const cost = calculateCompositeCost([
      { costPrice: null, quantity: 5 },
      { costPrice: 4, quantity: 2 }, // 8
    ]);
    expect(cost).toBe(8);
  });
});

describe("validateCompositeComponents", () => {
  it("returns empty array for valid components", () => {
    const errors = validateCompositeComponents("prod-1", [
      { componentProductId: "prod-2", quantity: 1 },
    ]);
    expect(errors).toEqual([]);
  });

  it("rejects empty components", () => {
    const errors = validateCompositeComponents("prod-1", []);
    expect(errors).toContain("Um produto composto precisa de pelo menos um componente");
  });

  it("rejects zero or negative quantity", () => {
    const errors = validateCompositeComponents("prod-1", [
      { componentProductId: "prod-2", quantity: 0 },
    ]);
    expect(errors).toContain("A quantidade de cada componente deve ser maior que zero");
  });

  it("rejects self-reference", () => {
    const errors = validateCompositeComponents("prod-1", [
      { componentProductId: "prod-1", quantity: 1 },
    ]);
    expect(errors).toContain("Um produto não pode ser componente dele mesmo");
  });

  it("skips self-reference check when productId is undefined (create)", () => {
    const errors = validateCompositeComponents(undefined, [
      { componentProductId: "prod-2", quantity: 1 },
    ]);
    expect(errors).toEqual([]);
  });
});

describe("isLowStock", () => {
  it("returns false when quantity is null", () => {
    expect(isLowStock(null, 5)).toBe(false);
  });

  it("returns false when threshold is null", () => {
    expect(isLowStock(3, null)).toBe(false);
  });

  it("returns true when quantity equals threshold", () => {
    expect(isLowStock(5, 5)).toBe(true);
  });

  it("returns true when quantity is below threshold", () => {
    expect(isLowStock(2, 5)).toBe(true);
  });

  it("returns false when quantity is above threshold", () => {
    expect(isLowStock(10, 5)).toBe(false);
  });
});

describe("calculateStockStatus", () => {
  it("returns untracked when quantity is null", () => {
    expect(calculateStockStatus(null, null)).toBe("untracked");
  });

  it("returns out when quantity is 0", () => {
    expect(calculateStockStatus(0, 5)).toBe("out");
  });

  it("returns low when at threshold", () => {
    expect(calculateStockStatus(5, 5)).toBe("low");
  });

  it("returns ok when above threshold", () => {
    expect(calculateStockStatus(10, 5)).toBe("ok");
  });

  it("returns ok when no threshold set", () => {
    expect(calculateStockStatus(10, null)).toBe("ok");
  });
});
