import type { Product } from "@lucro-caseiro/contracts";

import { productNameMatchesSearch } from "./display";

export function productMatchesSearch(product: Product, search: string): boolean {
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  if (!normalizedSearch) return true;
  if (productNameMatchesSearch(product.name, normalizedSearch)) return true;
  return (product.code ?? "").toLocaleLowerCase("pt-BR").includes(normalizedSearch);
}

let internalCodeSequence = 0;

export function createInternalProductCode(
  now = Date.now(),
  sequence = internalCodeSequence++,
): string {
  const timePart = now.toString(36).toUpperCase();
  const sequencePart = (sequence % 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
  return `LC-${timePart}-${sequencePart}`;
}
