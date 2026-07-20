import type { Product, Recipe } from "@lucro-caseiro/contracts";

export interface RecipeProfitability {
  recipeId: string;
  recipeName: string;
  productName: string;
  profitPerUnit: number;
  marginPercent: number;
}

export interface RecipeStatistics {
  averageRecipeCost: number;
  averageMarginPercent: number | null;
  profitability: RecipeProfitability[];
}

export function calculateRecipeStatistics(
  recipes: readonly Recipe[],
  products: readonly Product[],
): RecipeStatistics {
  const averageRecipeCost = recipes.length
    ? recipes.reduce((total, recipe) => total + recipe.totalCost, 0) / recipes.length
    : 0;
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const bestByRecipe = new Map<string, RecipeProfitability>();

  for (const product of products) {
    if (!product.isActive || !product.recipeId) continue;
    const recipe = recipesById.get(product.recipeId);
    if (!recipe || product.salePrice <= 0) continue;

    const profitPerUnit = product.salePrice - recipe.costPerUnit;
    const candidate: RecipeProfitability = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      productName: product.name,
      profitPerUnit,
      marginPercent: (profitPerUnit / product.salePrice) * 100,
    };
    const current = bestByRecipe.get(recipe.id);
    if (!current || candidate.profitPerUnit > current.profitPerUnit) {
      bestByRecipe.set(recipe.id, candidate);
    }
  }

  const profitability = [...bestByRecipe.values()].sort(
    (left, right) => right.profitPerUnit - left.profitPerUnit,
  );
  const averageMarginPercent = profitability.length
    ? profitability.reduce((total, item) => total + item.marginPercent, 0) /
      profitability.length
    : null;

  return { averageRecipeCost, averageMarginPercent, profitability };
}
