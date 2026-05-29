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

interface PricingInput {
  ingredientCost: number;
  packagingCost: number;
  laborCost: number;
  fixedCostShare: number;
  marginPercent: number;
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

  return errors;
}
