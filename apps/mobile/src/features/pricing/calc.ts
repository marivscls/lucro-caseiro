/**
 * Cálculos puros da precificação (preview ao vivo no cliente).
 * Espelham o `pricing.domain.ts` do backend, que recalcula e persiste.
 */

/** Custo de mão de obra: minutos / 60 × valor da hora. */
export function laborCost(minutes: number, hourlyRate: number): number {
  return (minutes / 60) * hourlyRate;
}

/** Custo total = insumos + embalagem + mão de obra + rateio de custo fixo. */
export function totalCost(
  ingredient: number,
  packaging: number,
  labor: number,
  fixedShare: number,
): number {
  return ingredient + packaging + labor + fixedShare;
}

/** Preço sugerido = custo × (1 + margem%). */
export function suggestedPrice(cost: number, marginPercent: number): number {
  return cost * (1 + marginPercent / 100);
}

/** Lucro por unidade = preço sugerido − custo. */
export function profitPerUnit(suggested: number, cost: number): number {
  return suggested - cost;
}

/**
 * Preço final com gross-up das taxas (iFood/cartão incidem sobre a venda):
 * `preço / (1 - taxa)`. Só aplica quando 0 < taxa% < 100 (evita divisão por
 * zero / valor negativo); fora disso devolve o preço sugerido sem inflar.
 */
export function finalPriceWithFees(
  suggested: number,
  feesPercent: number,
): { finalPrice: number; feesAmount: number } {
  const finalPrice =
    feesPercent > 0 && feesPercent < 100
      ? suggested / (1 - feesPercent / 100)
      : suggested;
  return { finalPrice, feesAmount: finalPrice - suggested };
}
