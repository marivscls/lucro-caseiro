import type { RecipeIngredient } from "@lucro-caseiro/contracts";

import type { CreateRecipeData, MaterialLine } from "./recipes.types";

export function validateRecipeData(data: CreateRecipeData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome da receita é obrigatório");
  }

  if (data.name.length > 200) {
    errors.push("Nome da receita deve ter no máximo 200 caracteres");
  }

  if (data.category.trim().length === 0) {
    errors.push("Categoria é obrigatória");
  }

  if (data.yieldQuantity <= 0) {
    errors.push("Rendimento deve ser maior que zero");
  }

  if (data.yieldUnit.trim().length === 0) {
    errors.push("Unidade de rendimento é obrigatória");
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push("Receita deve ter pelo menos um insumo");
  }

  return errors;
}

export function calculateRecipeCost(lines: MaterialLine[]): number {
  return lines.reduce((total, line) => {
    return total + line.materialCostPerUnit * line.quantity;
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
