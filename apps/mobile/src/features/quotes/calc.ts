/**
 * Cálculo puro do total do orçamento (preview no cliente).
 * Espelha o `computeQuoteTotal` do backend (quotes.domain.ts): soma de
 * (quantidade × preço) com arredondamento em centavos. Itens com valor
 * inválido (NaN) são ignorados — o cliente recebe o total já parseado.
 */

/** Subtotal de um item arredondado em centavos. */
export function quoteItemSubtotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

/** Total do orçamento: soma dos subtotais; ignora itens com número inválido. */
export function computeQuoteTotal(
  items: ReadonlyArray<{ quantity: number; unitPrice: number }>,
): number {
  return items.reduce((sum, item) => {
    if (Number.isNaN(item.quantity) || Number.isNaN(item.unitPrice)) return sum;
    return sum + quoteItemSubtotal(item.quantity, item.unitPrice);
  }, 0);
}
