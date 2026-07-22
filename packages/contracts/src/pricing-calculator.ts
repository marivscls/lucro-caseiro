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

/** Preço sugerido = custo × (1 + acréscimo sobre o custo%). */
export function suggestedPrice(cost: number, marginPercent: number): number {
  return cost * (1 + marginPercent / 100);
}

/** Lucro por unidade = preço sugerido − custo. */
export function profitPerUnit(suggested: number, cost: number): number {
  return suggested - cost;
}

/**
 * Faz o gross-up de taxas que incidem sobre a venda para preservar o valor
 * líquido. Percentuais fora do intervalo seguro não alteram o preço.
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
