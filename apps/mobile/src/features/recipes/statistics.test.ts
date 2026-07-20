import type { Product, Recipe } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { calculateRecipeStatistics } from "./statistics";

function recipe(
  id: string,
  name: string,
  totalCost: number,
  costPerUnit: number,
): Recipe {
  return {
    id,
    userId: "11111111-1111-1111-1111-111111111111",
    name,
    category: "Doces",
    instructions: null,
    yieldQuantity: 10,
    yieldUnit: "un",
    photoUrl: null,
    totalCost,
    costPerUnit,
    ingredients: [],
    createdAt: "2026-07-20T12:00:00.000Z",
  };
}

function product(
  id: string,
  name: string,
  recipeId: string | null,
  salePrice: number,
  isActive = true,
): Product {
  return {
    id,
    userId: "11111111-1111-1111-1111-111111111111",
    name,
    description: null,
    category: "Doces",
    photoUrl: null,
    extraPhotos: [],
    code: null,
    salePrice,
    saleUnit: "unit",
    costPrice: null,
    recipeId,
    stockQuantity: null,
    stockAlertThreshold: null,
    isComposite: false,
    isActive,
    createdAt: "2026-07-20T12:00:00.000Z",
  };
}

describe("calculateRecipeStatistics", () => {
  it("calcula custo medio, margem e ranking pelo lucro unitario", () => {
    const recipes = [recipe("r1", "Brownie", 20, 2), recipe("r2", "Bolo", 40, 10)];
    const products = [
      product("p1", "Brownie simples", "r1", 5),
      product("p2", "Brownie premium", "r1", 8),
      product("p3", "Fatia de bolo", "r2", 15),
    ];

    const result = calculateRecipeStatistics(recipes, products);

    expect(result.averageRecipeCost).toBe(30);
    expect(result.profitability.map((item) => item.recipeName)).toEqual([
      "Brownie",
      "Bolo",
    ]);
    expect(result.profitability[0]).toMatchObject({
      productName: "Brownie premium",
      profitPerUnit: 6,
      marginPercent: 75,
    });
    expect(result.averageMarginPercent).toBeCloseTo(54.17, 2);
  });

  it("ignora produtos inativos ou sem receita vinculada", () => {
    const recipes = [recipe("r1", "Brownie", 20, 2)];
    const products = [
      product("p1", "Inativo", "r1", 8, false),
      product("p2", "Sem receita", null, 8),
    ];

    expect(calculateRecipeStatistics(recipes, products)).toEqual({
      averageRecipeCost: 20,
      averageMarginPercent: null,
      profitability: [],
    });
  });
});
