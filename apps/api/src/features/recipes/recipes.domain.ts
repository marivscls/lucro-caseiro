import type { RecipeIngredient } from "@lucro-caseiro/contracts";

import type { CreateRecipeData, IngredientWithPrice } from "./recipes.types";

export function validateRecipeData(data: CreateRecipeData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome da receita e obrigatorio");
  }

  if (data.name.length > 200) {
    errors.push("Nome da receita deve ter no maximo 200 caracteres");
  }

  if (data.category.trim().length === 0) {
    errors.push("Categoria e obrigatoria");
  }

  if (data.yieldQuantity <= 0) {
    errors.push("Rendimento deve ser maior que zero");
  }

  if (data.yieldUnit.trim().length === 0) {
    errors.push("Unidade de rendimento e obrigatoria");
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push("Receita deve ter pelo menos um ingrediente");
  }

  return errors;
}

export function calculateRecipeCost(ingredients: IngredientWithPrice[]): number {
  return ingredients.reduce((total, ing) => {
    const pricePerUnit = ing.ingredientPrice / ing.quantityPerPackage;
    return total + pricePerUnit * ing.quantity;
  }, 0);
}

export function calculateCostPerUnit(totalCost: number, yieldQuantity: number): number {
  if (yieldQuantity <= 0) return 0;
  return totalCost / yieldQuantity;
}

export function scaleRecipe(
  ingredients: RecipeIngredient[],
  multiplier: number,
): RecipeIngredient[] {
  return ingredients.map((ing) => ({
    ...ing,
    quantity: ing.quantity * multiplier,
  }));
}
