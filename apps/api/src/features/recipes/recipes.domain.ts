import { materialCostPerLineUnit } from "@lucro-caseiro/contracts";
import type { MaterialUnitCostInfo, RecipeIngredient } from "@lucro-caseiro/contracts";

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

export type MaterialCostInfo = MaterialUnitCostInfo;

/**
 * Custo efetivo por unidade da LINHA da receita (regra em `materialCostPerLineUnit`,
 * de contracts, a mesma usada na prévia do app):
 *
 * 1. linha na unidade do insumo: `costPerUnit`;
 * 2. linha na unidade de conteudo declarada (#14, ex.: 1 lata = 350 ml):
 *    `costPerUnit / contentPerUnit`;
 * 3. peso/volume da mesma familia (kg↔g, L↔ml): conversao automatica, sem cadastro
 *    extra (ex.: insumo em kg a R$ 6,00, linha em g -> R$ 0,006);
 * 4. conteudo em peso/volume e linha na unidade irma (1 lata = 395 g, linha em kg);
 * 5. sem conversao conhecida: `costPerUnit` inalterado.
 *
 * Comparacao de unidades: case-insensitive e com trim. Divisao por zero protegida.
 */
export function effectiveCostPerUnit(
  material: MaterialCostInfo,
  lineUnit: string,
): number {
  return materialCostPerLineUnit(material, lineUnit);
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
