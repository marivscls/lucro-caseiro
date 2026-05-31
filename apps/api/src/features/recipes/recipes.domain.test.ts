import { describe, expect, it } from "vitest";

import {
  calculateCostPerUnit,
  calculateRecipeCost,
  scaleRecipe,
  validateRecipeData,
} from "./recipes.domain";
import type { CreateRecipeData, MaterialLine } from "./recipes.types";

function makeRecipeData(overrides: Partial<CreateRecipeData> = {}): CreateRecipeData {
  return {
    name: "Brigadeiro",
    category: "doces",
    yieldQuantity: 30,
    yieldUnit: "unidades",
    ingredients: [{ materialId: "mat-1", quantity: 395, unit: "g" }],
    ...overrides,
  };
}

function makeMaterialLine(overrides: Partial<MaterialLine> = {}): MaterialLine {
  return {
    materialId: "mat-1",
    materialName: "Leite Condensado",
    materialCostPerUnit: 0.5,
    quantity: 15,
    unit: "g",
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
    expect(errors).toContain("Nome da receita é obrigatório");
  });

  it("rejects name over 200 chars", () => {
    const errors = validateRecipeData(makeRecipeData({ name: "a".repeat(201) }));
    expect(errors).toContain("Nome da receita deve ter no máximo 200 caracteres");
  });

  it("rejects empty category", () => {
    const errors = validateRecipeData(makeRecipeData({ category: "   " }));
    expect(errors).toContain("Categoria é obrigatória");
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
    expect(errors).toContain("Unidade de rendimento é obrigatória");
  });

  it("accepts decimal yield quantity (ex: 1.5 kg)", () => {
    const errors = validateRecipeData(
      makeRecipeData({ yieldQuantity: 1.5, yieldUnit: "kg" }),
    );
    expect(errors).toEqual([]);
  });

  it("rejects empty ingredients list", () => {
    const errors = validateRecipeData(makeRecipeData({ ingredients: [] }));
    expect(errors).toContain("Receita deve ter pelo menos um insumo");
  });

  it("accumulates multiple errors", () => {
    const errors = validateRecipeData(
      makeRecipeData({ name: "", category: "", yieldQuantity: 0, ingredients: [] }),
    );
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe("calculateRecipeCost", () => {
  it("calculates total cost for single material line", () => {
    const lines = [makeMaterialLine()];
    const cost = calculateRecipeCost(lines);
    // 0.5 * 15 = 7.5
    expect(cost).toBeCloseTo(7.5);
  });

  it("calculates total cost for multiple material lines", () => {
    const lines = [
      makeMaterialLine({ materialCostPerUnit: 0.5, quantity: 15 }),
      makeMaterialLine({
        materialId: "mat-2",
        materialName: "Chocolate em Po",
        materialCostPerUnit: 0.05,
        quantity: 100,
      }),
    ];
    const cost = calculateRecipeCost(lines);
    // (0.5*15) + (0.05*100) = 7.5 + 5 = 12.5
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

  it("calculates cost per unit with decimal yield (ex: 1.5 kg)", () => {
    expect(calculateCostPerUnit(12, 1.5)).toBeCloseTo(8, 5);
  });
});

describe("scaleRecipe", () => {
  it("scales ingredient quantities by multiplier", () => {
    const lines = [
      { materialId: "mat-1", quantity: 395, unit: "g" },
      { materialId: "mat-2", quantity: 100, unit: "g" },
    ];

    const scaled = scaleRecipe(lines, 2);

    expect(scaled[0]!.quantity).toBe(790);
    expect(scaled[1]!.quantity).toBe(200);
  });

  it("handles fractional multipliers", () => {
    const lines = [{ materialId: "mat-1", quantity: 100, unit: "ml" }];

    const scaled = scaleRecipe(lines, 0.5);

    expect(scaled[0]!.quantity).toBe(50);
  });

  it("preserves other material properties", () => {
    const lines = [{ materialId: "mat-1", quantity: 100, unit: "g" }];

    const scaled = scaleRecipe(lines, 3);

    expect(scaled[0]!.materialId).toBe("mat-1");
    expect(scaled[0]!.unit).toBe("g");
  });

  it("returns empty array for empty input", () => {
    expect(scaleRecipe([], 2)).toEqual([]);
  });
});
