import { describe, expect, it } from "vitest";

import {
  calculateCostPerUnit,
  calculateRecipeCost,
  scaleRecipe,
  validateRecipeData,
} from "./recipes.domain";
import type { CreateRecipeData, IngredientWithPrice } from "./recipes.types";

function makeRecipeData(overrides: Partial<CreateRecipeData> = {}): CreateRecipeData {
  return {
    name: "Brigadeiro",
    category: "doces",
    yieldQuantity: 30,
    yieldUnit: "unidades",
    ingredients: [{ ingredientId: "ing-1", quantity: 395, unit: "g" }],
    ...overrides,
  };
}

function makeIngredientWithPrice(
  overrides: Partial<IngredientWithPrice> = {},
): IngredientWithPrice {
  return {
    ingredientId: "ing-1",
    ingredientName: "Leite Condensado",
    ingredientPrice: 7.5,
    quantity: 395,
    unit: "g",
    quantityPerPackage: 395,
    ...overrides,
  };
}

describe("validateRecipeData", () => {
  it("returns empty array for valid data", () => {
    const errors = validateRecipeData(makeRecipeData());
    expect(errors).toEqual([]);
  });

  it("rejects empty name", () => {
    const errors = validateRecipeData(makeRecipeData({ name: "   " }));
    expect(errors).toContain("Nome da receita e obrigatorio");
  });

  it("rejects name over 200 chars", () => {
    const errors = validateRecipeData(makeRecipeData({ name: "a".repeat(201) }));
    expect(errors).toContain("Nome da receita deve ter no maximo 200 caracteres");
  });

  it("rejects empty category", () => {
    const errors = validateRecipeData(makeRecipeData({ category: "   " }));
    expect(errors).toContain("Categoria e obrigatoria");
  });

  it("rejects zero yield quantity", () => {
    const errors = validateRecipeData(makeRecipeData({ yieldQuantity: 0 }));
    expect(errors).toContain("Rendimento deve ser maior que zero");
  });

  it("rejects negative yield quantity", () => {
    const errors = validateRecipeData(makeRecipeData({ yieldQuantity: -5 }));
    expect(errors).toContain("Rendimento deve ser maior que zero");
  });

  it("rejects empty yield unit", () => {
    const errors = validateRecipeData(makeRecipeData({ yieldUnit: "   " }));
    expect(errors).toContain("Unidade de rendimento e obrigatoria");
  });

  it("rejects empty ingredients list", () => {
    const errors = validateRecipeData(makeRecipeData({ ingredients: [] }));
    expect(errors).toContain("Receita deve ter pelo menos um ingrediente");
  });

  it("accumulates multiple errors", () => {
    const errors = validateRecipeData(
      makeRecipeData({ name: "", category: "", yieldQuantity: 0, ingredients: [] }),
    );
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe("calculateRecipeCost", () => {
  it("calculates total cost for single ingredient", () => {
    const ingredients = [makeIngredientWithPrice()];
    const cost = calculateRecipeCost(ingredients);
    // 7.5 / 395 * 395 = 7.5
    expect(cost).toBeCloseTo(7.5);
  });

  it("calculates total cost for multiple ingredients", () => {
    const ingredients = [
      makeIngredientWithPrice({
        ingredientPrice: 7.5,
        quantity: 395,
        quantityPerPackage: 395,
      }),
      makeIngredientWithPrice({
        ingredientId: "ing-2",
        ingredientName: "Chocolate em Po",
        ingredientPrice: 10,
        quantity: 100,
        quantityPerPackage: 200,
      }),
    ];
    const cost = calculateRecipeCost(ingredients);
    // 7.5 + (10/200)*100 = 7.5 + 5 = 12.5
    expect(cost).toBeCloseTo(12.5);
  });

  it("returns 0 for empty list", () => {
    expect(calculateRecipeCost([])).toBe(0);
  });
});

describe("calculateCostPerUnit", () => {
  it("calculates cost per unit correctly", () => {
    expect(calculateCostPerUnit(12.5, 30)).toBeCloseTo(0.4167, 3);
  });

  it("returns 0 when yield is zero", () => {
    expect(calculateCostPerUnit(10, 0)).toBe(0);
  });

  it("returns 0 when yield is negative", () => {
    expect(calculateCostPerUnit(10, -1)).toBe(0);
  });
});

describe("scaleRecipe", () => {
  it("scales ingredient quantities by multiplier", () => {
    const ingredients = [
      { ingredientId: "ing-1", quantity: 395, unit: "g" },
      { ingredientId: "ing-2", quantity: 100, unit: "g" },
    ];

    const scaled = scaleRecipe(ingredients, 2);

    expect(scaled[0]!.quantity).toBe(790);
    expect(scaled[1]!.quantity).toBe(200);
  });

  it("handles fractional multipliers", () => {
    const ingredients = [{ ingredientId: "ing-1", quantity: 100, unit: "ml" }];

    const scaled = scaleRecipe(ingredients, 0.5);

    expect(scaled[0]!.quantity).toBe(50);
  });

  it("preserves other ingredient properties", () => {
    const ingredients = [{ ingredientId: "ing-1", quantity: 100, unit: "g" }];

    const scaled = scaleRecipe(ingredients, 3);

    expect(scaled[0]!.ingredientId).toBe("ing-1");
    expect(scaled[0]!.unit).toBe("g");
  });

  it("returns empty array for empty input", () => {
    expect(scaleRecipe([], 2)).toEqual([]);
  });
});
