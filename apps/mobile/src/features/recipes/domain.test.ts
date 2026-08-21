import type { Recipe } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  ALL_RECIPES_CATEGORY,
  averageRecipeCost,
  displayRecipeName,
  filterRecipes,
  formatRecipeQuantity,
  recipeCategoryFilters,
  recipeCountLabel,
  recipeKindLabel,
  recipeListSummary,
} from "./domain";

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    name: "Brigadeiro gourmet",
    category: "Doces",
    instructions: null,
    yieldQuantity: 50,
    yieldUnit: "un",
    photoUrl: null,
    totalCost: 119.5,
    costPerUnit: 2.39,
    ingredients: [],
    createdAt: "2026-08-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("displayRecipeName", () => {
  it("omite prefixos técnicos sem alterar nomes comuns", () => {
    expect(displayRecipeName("[massa] Brigadeiro gourmet")).toBe("Brigadeiro gourmet");
    expect(displayRecipeName("Bolo de chocolate")).toBe("Bolo de chocolate");
  });
});

describe("recipeKindLabel", () => {
  it("capitaliza o prefixo técnico para a pill", () => {
    expect(recipeKindLabel("[massa] Brigadeiro gourmet")).toBe("Massa");
    expect(recipeKindLabel("[recheio] Recheio quatro leites")).toBe("Recheio");
  });

  it("retorna null quando não há prefixo", () => {
    expect(recipeKindLabel("Brownie intenso")).toBeNull();
    expect(recipeKindLabel("[] vazio")).toBeNull();
  });
});

describe("formatRecipeQuantity", () => {
  it("formata decimais com vírgula e preserva inteiros", () => {
    expect(formatRecipeQuantity(50)).toBe("50");
    expect(formatRecipeQuantity(2.5)).toBe("2,5");
    expect(formatRecipeQuantity(1.2)).toBe("1,2");
  });
});

describe("recipeCountLabel", () => {
  it("usa singular e plural corretos", () => {
    expect(recipeCountLabel(1, "receita", "receitas")).toBe("1 receita");
    expect(recipeCountLabel(6, "receita", "receitas")).toBe("6 receitas");
  });
});

describe("averageRecipeCost / recipeListSummary", () => {
  it("média o totalCost real e não inventa o número 6", () => {
    const recipes = [recipe({ totalCost: 10 }), recipe({ totalCost: 20 })];
    expect(averageRecipeCost(recipes)).toBe(15);
    expect(recipeListSummary(recipes)).toEqual({ count: 2, averageCost: 15 });
    expect(recipeListSummary([])).toEqual({ count: 0, averageCost: 0 });
  });
});

describe("recipeCategoryFilters", () => {
  it("mantém Todas primeiro, presets e categorias reais extras", () => {
    const recipes = [
      recipe({ category: "Doces" }),
      recipe({ category: "Tortas" }),
      recipe({ category: "Doces" }),
    ];
    expect(
      recipeCategoryFilters(recipes, ["Doces", "Salgados", "Bolos", "Bebidas", "Outros"]),
    ).toEqual(["Todas", "Doces", "Salgados", "Bolos", "Bebidas", "Outros", "Tortas"]);
    expect(recipeCategoryFilters([], ["Doces"])[0]).toBe(ALL_RECIPES_CATEGORY);
  });
});

describe("filterRecipes", () => {
  const recipes = [
    recipe({ id: "1", name: "[massa] Brigadeiro gourmet", category: "Doces" }),
    recipe({ id: "2", name: "Bolo de chocolate", category: "Bolos" }),
    recipe({ id: "3", name: "Torta de morango", category: "Tortas" }),
  ];

  it("filtra por categoria e busca no nome visível", () => {
    expect(filterRecipes(recipes, { category: "Doces" }).map((item) => item.id)).toEqual([
      "1",
    ]);
    expect(
      filterRecipes(recipes, { query: "brigadeiro" }).map((item) => item.id),
    ).toEqual(["1"]);
    expect(filterRecipes(recipes, { query: "massa" }).map((item) => item.id)).toEqual([
      "1",
    ]);
    expect(filterRecipes(recipes, { category: "Bolos", query: "torta" })).toEqual([]);
  });
});
