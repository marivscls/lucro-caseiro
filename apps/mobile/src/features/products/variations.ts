import type { Product, ProductVariationInput } from "@lucro-caseiro/contracts";

export function totalVariationStock(
  variations: readonly ProductVariationInput[] | undefined,
): number | null {
  if (!variations?.length) return null;
  const tracked = variations.filter((variation) => variation.stockQuantity !== undefined);
  if (tracked.length === 0) return null;
  return tracked.reduce((total, variation) => total + (variation.stockQuantity ?? 0), 0);
}

export function availableProductStock(product: Product): number | null {
  return totalVariationStock(product.variations) ?? product.stockQuantity;
}

export function validateVariations(
  variations: readonly ProductVariationInput[],
): string | null {
  const names = variations.map((variation) => variation.name.trim());
  if (names.some((name) => !name)) return "Dê um nome para cada variação.";
  const normalized = names.map((name) => name.toLocaleLowerCase("pt-BR"));
  if (new Set(normalized).size !== normalized.length) {
    return "Não repita o mesmo nome de variação.";
  }
  if (variations.some((variation) => (variation.stockQuantity ?? 0) < 0)) {
    return "O estoque da variação não pode ser negativo.";
  }
  return null;
}
