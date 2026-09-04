import { displayIngredientName } from "../../shared/ingredient-image/resolve";

/** Nome visível do produto, sem prefixos técnicos como "[massa]". */
export function displayProductName(name: string): string {
  return displayIngredientName(name);
}

/** Inicial visual do produto, ignorando prefixos técnicos como "[massa]". */
export function productInitial(name: string): string {
  const visibleName = displayProductName(name);
  return visibleName.charAt(0).toUpperCase() || "P";
}

/** Casa busca com o nome gravado e com o nome visível (sem prefixos técnicos). */
export function productNameMatchesSearch(name: string, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return true;
  return [name, displayProductName(name)].some((value) =>
    value.toLocaleLowerCase("pt-BR").includes(normalized),
  );
}
