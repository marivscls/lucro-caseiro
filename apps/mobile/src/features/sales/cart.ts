/**
 * Cálculos puros do carrinho de venda (preview no cliente).
 * Espelha o `calculateSaleTotal` do backend (sales.domain.ts), incluindo
 * venda por peso (quantidade decimal em kg × preço/kg).
 */

/** Subtotal de um item: preço unitário × quantidade (qtd pode ser decimal/kg). */
export function itemSubtotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

/** Total do carrinho: soma dos subtotais. Carrinho vazio → 0. */
export function cartTotal(
  items: ReadonlyArray<{ unitPrice: number; quantity: number }>,
): number {
  return items.reduce(
    (sum, item) => sum + itemSubtotal(item.unitPrice, item.quantity),
    0,
  );
}

export function salePricing(
  subtotal: number,
  discountType: "fixed" | "percentage" | null,
  discountValue: number,
): { subtotal: number; discount: number; total: number } {
  let requested = 0;
  if (discountType === "percentage") {
    requested = subtotal * (Math.min(Math.max(discountValue, 0), 100) / 100);
  }
  if (discountType === "fixed") {
    requested = Math.max(discountValue, 0);
  }
  const discount = Math.min(requested, subtotal);
  return { subtotal, discount, total: subtotal - discount };
}

/** Formata um peso em kg com vírgula decimal, até 3 casas (ex.: "1,5 kg"). */
export function formatWeight(kg: number): string {
  const str = Number.parseFloat(kg.toFixed(3)).toString().replace(".", ",");
  return `${str} kg`;
}
