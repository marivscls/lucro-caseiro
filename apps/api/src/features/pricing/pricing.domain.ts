export function calculateTotalCost(
  ingredientCost: number,
  packagingCost: number,
  laborCost: number,
  fixedCostShare: number,
): number {
  return ingredientCost + packagingCost + laborCost + fixedCostShare;
}

export function calculateSuggestedPrice(
  totalCost: number,
  marginPercent: number,
): number {
  return totalCost * (1 + marginPercent / 100);
}

export function calculateProfitPerUnit(
  suggestedPrice: number,
  totalCost: number,
): number {
  return suggestedPrice - totalCost;
}

/**
 * Aplica taxas percentuais (iFood, cartão, comissão) sobre o PREÇO DE VENDA — não
 * sobre o custo. Usa **gross-up** para preservar a margem: o vendedor precisa
 * receber `suggestedPrice` líquido depois que a plataforma/maquininha descontar a
 * taxa. Logo `finalPrice × (1 − feesPercent/100) = suggestedPrice`.
 *
 * Ex.: suggestedPrice R$20, feesPercent 18% → finalPrice = 20 / 0,82 = R$24,39
 * (somar 20 × 18% = R$3,60 daria R$23,60 e o vendedor receberia menos que R$20).
 */
export function calculatePriceWithFees(
  suggestedPrice: number,
  feesPercent: number,
): { finalPrice: number; feesAmount: number } {
  if (feesPercent <= 0) {
    return { finalPrice: suggestedPrice, feesAmount: 0 };
  }
  const finalPrice = suggestedPrice / (1 - feesPercent / 100);
  return { finalPrice, feesAmount: finalPrice - suggestedPrice };
}

interface PricingInput {
  ingredientCost: number;
  packagingCost: number;
  laborCost: number;
  fixedCostShare: number;
  marginPercent: number;
  feesPercent?: number;
}

export function validatePricingData(data: PricingInput): string[] {
  const errors: string[] = [];

  if (data.ingredientCost < 0) {
    errors.push("Custo de ingredientes não pode ser negativo");
  }

  if (data.packagingCost < 0) {
    errors.push("Custo de embalagem não pode ser negativo");
  }

  if (data.laborCost < 0) {
    errors.push("Custo de mao de obra não pode ser negativo");
  }

  if (data.fixedCostShare < 0) {
    errors.push("Rateio de custos fixos não pode ser negativo");
  }

  if (data.marginPercent < 0) {
    errors.push("Margem de lucro não pode ser negativa");
  }

  if (data.marginPercent > 1000) {
    errors.push("Margem de lucro não pode exceder 1000%");
  }

  if (data.feesPercent !== undefined) {
    if (data.feesPercent < 0) {
      errors.push("Taxas em % não podem ser negativas");
    }
    if (data.feesPercent >= 100) {
      errors.push("Taxas em % não podem chegar a 100%");
    }
  }

  return errors;
}
