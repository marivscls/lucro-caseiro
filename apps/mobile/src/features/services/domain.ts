import {
  finalPriceWithFees,
  laborCost,
  suggestedPrice,
  totalCost,
} from "@lucro-caseiro/contracts";
import type { Service } from "@lucro-caseiro/contracts";

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

export type ServiceFilter = "active" | "review" | "inactive" | "all";
export type ServicePriceHealth = "missing-price" | "below-cost" | "costed" | "price-only";

export interface ServiceOverview {
  totalCount: number;
  activeCount: number;
  pricedCount: number;
  attentionCount: number;
  averagePrice: number | null;
  averageDurationMinutes: number | null;
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

export function calculateStoredServicePricing(service: Service): ServicePricingResult {
  return calculateServicePricing({
    durationMinutes: service.durationMinutes,
    materialCost: service.materialCost,
    hourlyRate: service.hourlyRate,
    otherCost: service.otherCost,
    fixedCostShare: service.fixedCostShare,
    markupPercent: service.markupPercent,
    feesPercent: service.feesPercent,
  });
}

export function serviceHasCostData(service: Service): boolean {
  return (
    service.materialCost > 0 ||
    service.hourlyRate > 0 ||
    service.otherCost > 0 ||
    service.fixedCostShare > 0
  );
}

export function servicePriceHealth(service: Service): ServicePriceHealth {
  if (service.defaultPrice == null) return "missing-price";
  if (!serviceHasCostData(service)) return "price-only";

  const pricing = calculateStoredServicePricing(service);
  const priceAfterFees =
    service.defaultPrice * (1 - Math.min(service.feesPercent, 95) / 100);
  return priceAfterFees < pricing.totalCost ? "below-cost" : "costed";
}

export function serviceNeedsPriceReview(service: Service): boolean {
  if (!service.active) return false;
  const health = servicePriceHealth(service);
  return health === "missing-price" || health === "below-cost";
}

export function buildServiceOverview(services: readonly Service[]): ServiceOverview {
  const active = services.filter((service) => service.active);
  const priced = active.filter((service) => service.defaultPrice != null);
  const averagePrice =
    priced.length > 0
      ? priced.reduce((total, service) => total + (service.defaultPrice ?? 0), 0) /
        priced.length
      : null;
  const averageDurationMinutes =
    active.length > 0
      ? Math.round(
          active.reduce((total, service) => total + service.durationMinutes, 0) /
            active.length,
        )
      : null;

  return {
    totalCount: services.length,
    activeCount: active.length,
    pricedCount: priced.length,
    attentionCount: active.filter(serviceNeedsPriceReview).length,
    averagePrice,
    averageDurationMinutes,
  };
}

export function filterServices(
  services: readonly Service[],
  filter: ServiceFilter,
  search: string,
): Service[] {
  const query = search.trim().toLocaleLowerCase("pt-BR");
  return services.filter((service) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && service.active) ||
      (filter === "inactive" && !service.active) ||
      (filter === "review" && serviceNeedsPriceReview(service));
    const matchesSearch =
      !query ||
      service.name.toLocaleLowerCase("pt-BR").includes(query) ||
      service.description?.toLocaleLowerCase("pt-BR").includes(query);
    return matchesFilter && matchesSearch;
  });
}
