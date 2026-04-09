import { describe, expect, it } from "vitest";

import { calculatePricePerUnit, validateIngredientData } from "./ingredients.domain";
import type { CreateIngredientData } from "./ingredients.types";

function makeIngredientData(
  overrides: Partial<CreateIngredientData> = {},
): CreateIngredientData {
  return {
    name: "Leite Condensado",
    price: 7.5,
    quantityPerPackage: 395,
    unit: "g",
    ...overrides,
  };
}

describe("validateIngredientData", () => {
  it("returns empty array for valid data", () => {
    const errors = validateIngredientData(makeIngredientData());
    expect(errors).toEqual([]);
  });

  it("rejects empty name", () => {
    const errors = validateIngredientData(makeIngredientData({ name: "   " }));
    expect(errors).toContain("Nome do ingrediente e obrigatorio");
  });

  it("rejects name over 200 chars", () => {
    const errors = validateIngredientData(makeIngredientData({ name: "a".repeat(201) }));
    expect(errors).toContain("Nome do ingrediente deve ter no maximo 200 caracteres");
  });

  it("rejects zero price", () => {
    const errors = validateIngredientData(makeIngredientData({ price: 0 }));
    expect(errors).toContain("Preco deve ser maior que zero");
  });

  it("rejects negative price", () => {
    const errors = validateIngredientData(makeIngredientData({ price: -5 }));
    expect(errors).toContain("Preco deve ser maior que zero");
  });

  it("rejects zero quantity per package", () => {
    const errors = validateIngredientData(makeIngredientData({ quantityPerPackage: 0 }));
    expect(errors).toContain("Quantidade por embalagem deve ser maior que zero");
  });

  it("rejects negative quantity per package", () => {
    const errors = validateIngredientData(makeIngredientData({ quantityPerPackage: -1 }));
    expect(errors).toContain("Quantidade por embalagem deve ser maior que zero");
  });

  it("rejects empty unit", () => {
    const errors = validateIngredientData(makeIngredientData({ unit: "   " }));
    expect(errors).toContain("Unidade e obrigatoria");
  });

  it("rejects unit over 20 chars", () => {
    const errors = validateIngredientData(makeIngredientData({ unit: "a".repeat(21) }));
    expect(errors).toContain("Unidade deve ter no maximo 20 caracteres");
  });

  it("accumulates multiple errors", () => {
    const errors = validateIngredientData(
      makeIngredientData({ name: "", price: -1, quantityPerPackage: 0 }),
    );
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("calculatePricePerUnit", () => {
  it("calculates price per unit correctly", () => {
    expect(calculatePricePerUnit(10, 500)).toBeCloseTo(0.02);
  });

  it("returns price when quantity is 1", () => {
    expect(calculatePricePerUnit(7.5, 1)).toBe(7.5);
  });

  it("handles decimal values", () => {
    expect(calculatePricePerUnit(7.5, 395)).toBeCloseTo(0.019, 3);
  });
});
