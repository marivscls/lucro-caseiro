/** Custo de mão de obra: minutos / 60 × valor da hora. */
export function laborCost(minutes: number, hourlyRate: number): number {
  return (minutes / 60) * hourlyRate;
}

/** Custo de mão de obra por unidade a partir do tempo e rendimento de um lote. */
export function laborCostPerUnit(
  batchMinutes: number,
  hourlyRate: number,
  batchUnits: number,
): number {
  if (batchMinutes <= 0 || hourlyRate <= 0 || batchUnits <= 0) return 0;
  return laborCost(batchMinutes, hourlyRate) / batchUnits;
}

/** Rateio mensal: gastos fixos do mês divididos pelas unidades produzidas. */
export function fixedCostShare(monthlyFixed: number, monthlyProduction: number): number {
  if (monthlyFixed <= 0 || monthlyProduction <= 0) return 0;
  return monthlyFixed / monthlyProduction;
}

/** Taxa de custos indiretos sobre o faturamento planejado. */
export function overheadPercent(monthlyFixed: number, revenueBasis: number): number {
  if (monthlyFixed <= 0 || revenueBasis <= 0) return 0;
  return (monthlyFixed / revenueBasis) * 100;
}

/**
 * Reserva custos indiretos como percentual da venda sem consumir o lucro desejado.
 *
 * precoBase = (custoDireto + lucroDesejado) / (1 - taxaCusteio)
 */
export function revenueCosting(
  directCost: number,
  markupPercent: number,
  costingPercent: number,
): {
  suggestedPrice: number;
  overheadAmount: number;
  totalCost: number;
  profitAmount: number;
} {
  const safeDirectCost = Math.max(0, directCost);
  const safeMarkup = Math.max(0, markupPercent);
  const safeCosting = costingPercent > 0 && costingPercent < 100 ? costingPercent : 0;
  const profitAmount = safeDirectCost * (safeMarkup / 100);
  const suggestedPrice = (safeDirectCost + profitAmount) / (1 - safeCosting / 100);
  const overheadAmount = suggestedPrice * (safeCosting / 100);
  return {
    suggestedPrice,
    overheadAmount,
    totalCost: safeDirectCost + overheadAmount,
    profitAmount,
  };
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
