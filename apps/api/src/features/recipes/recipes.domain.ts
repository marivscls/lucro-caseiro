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

export interface MaterialCostInfo {
  costPerUnit: number;
  contentPerUnit: number | null;
  contentUnit: string | null;
}

/**
 * #14 (LIGHT): custo efetivo por unidade da LINHA da receita.
 *
 * Se o insumo declara conteudo por unidade (ex.: 1 lata = 350 ml) E a linha esta
 * expressa nessa unidade de conteudo (ml), o custo por unidade de conteudo passa a ser
 * `costPerUnit / contentPerUnit`. Caso contrario, retorna `costPerUnit` inalterado
 * (compativel com o comportamento anterior).
 *
 * Comparacao de unidades: case-insensitive e com trim. Divisao por zero protegida.
 */
export function effectiveCostPerUnit(
  material: MaterialCostInfo,
  lineUnit: string,
): number {
  const { costPerUnit, contentPerUnit, contentUnit } = material;
  if (
    contentPerUnit != null &&
    contentPerUnit > 0 &&
    contentUnit != null &&
    contentUnit.trim().toLowerCase() === lineUnit.trim().toLowerCase()
  ) {
    return costPerUnit / contentPerUnit;
  }
  return costPerUnit;
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
