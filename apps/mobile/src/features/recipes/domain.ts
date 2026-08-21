import type { Recipe } from "@lucro-caseiro/contracts";

import { displayIngredientName } from "../../shared/ingredient-image/resolve";

export const ALL_RECIPES_CATEGORY = "Todas";

/** Nome visível da receita, sem prefixos técnicos como `[massa]`. */
export function displayRecipeName(rawName: string): string {
  return displayIngredientName(rawName);
}

/**
 * Tipo/base extraído do prefixo técnico (`[massa]` → `Massa`).
 * Não altera o valor persistido — só a apresentação.
 */
export function recipeKindLabel(rawName: string): string | null {
  const match = /^\[([^\]]+)]/.exec(rawName.trim());
  if (!match) return null;
  const kind = match[1].trim();
  if (!kind) return null;
  return kind.charAt(0).toLocaleUpperCase("pt-BR") + kind.slice(1);
}

/** Quantidade em pt-BR, sem zeros à direita supérfluos. */
export function formatRecipeQuantity(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toString().replace(".", ",");
}

export function recipeCountLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Custo médio por receita (média do `totalCost`), igual às estatísticas. */
export function averageRecipeCost(recipes: readonly Pick<Recipe, "totalCost">[]): number {
  if (!recipes.length) return 0;
  return recipes.reduce((total, recipe) => total + recipe.totalCost, 0) / recipes.length;
}

export function recipeListSummary(recipes: readonly Pick<Recipe, "totalCost">[]): {
  count: number;
  averageCost: number;
} {
  return { count: recipes.length, averageCost: averageRecipeCost(recipes) };
}

/**
 * Chips de filtro: `Todas` + presets do perfil + categorias reais ainda não listadas.
 */
export function recipeCategoryFilters(
  recipes: readonly Pick<Recipe, "category">[],
  presets: readonly string[],
): string[] {
  const seen = new Set<string>([ALL_RECIPES_CATEGORY]);
  const result: string[] = [ALL_RECIPES_CATEGORY];

  for (const category of [...presets, ...recipes.map((recipe) => recipe.category)]) {
    const value = category.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

export function filterRecipes(
  recipes: readonly Recipe[],
  opts: { category?: string; query?: string },
): Recipe[] {
  const query = (opts.query ?? "").trim().toLocaleLowerCase("pt-BR");
  const category = opts.category?.trim();

  return recipes.filter((recipe) => {
    if (category && recipe.category !== category) return false;
    if (!query) return true;
    const visibleName = displayRecipeName(recipe.name).toLocaleLowerCase("pt-BR");
    const rawName = recipe.name.toLocaleLowerCase("pt-BR");
    return visibleName.includes(query) || rawName.includes(query);
  });
}
