import {
  finalPriceWithFees,
  laborCost,
  suggestedPrice,
  totalCost,
} from "@lucro-caseiro/contracts";

export interface ServicePricingInput {
  durationMinutes: number;
  materialCost: number;
  hourlyRate: number;
  otherCost: number;
  fixedCostShare: number;
  markupPercent: number;
  feesPercent: number;
}

export interface ServicePricingResult {
  laborCost: number;
  totalCost: number;
  suggestedPrice: number;
  feesAmount: number;
}

export function calculateServicePricing(
  input: ServicePricingInput,
): ServicePricingResult {
  const calculatedLabor = laborCost(input.durationMinutes, input.hourlyRate);
  const calculatedTotal = totalCost(
    input.materialCost,
    input.otherCost,
    calculatedLabor,
    input.fixedCostShare,
  );
  const beforeFees = suggestedPrice(calculatedTotal, input.markupPercent);
  const withFees = finalPriceWithFees(beforeFees, input.feesPercent);

  return {
    laborCost: calculatedLabor,
    totalCost: calculatedTotal,
    suggestedPrice: withFees.finalPrice,
    feesAmount: withFees.feesAmount,
  };
}
