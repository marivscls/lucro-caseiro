import {
  finalPriceWithFees,
  laborCost,
  suggestedPrice,
  totalCost,
} from "@lucro-caseiro/contracts";
import type {
  Service,
  ServiceAddOnInput,
  ServicePackageInput,
  ServiceVariationInput,
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

export interface ServiceItemValidationError {
  kind: "variation" | "addOn" | "package";
  index: number;
  field:
    | "name"
    | "durationMinutes"
    | "price"
    | "sessions"
    | "validityDays"
    | "recurrenceDays";
  message: string;
}

function serviceItemError(
  kind: ServiceItemValidationError["kind"],
  index: number,
  field: ServiceItemValidationError["field"],
  message: string,
): ServiceItemValidationError {
  return { kind, index, field, message };
}

export function findServiceItemValidationError({
  variations,
  addOns,
  packages,
}: {
  variations: readonly ServiceVariationInput[];
  addOns: readonly ServiceAddOnInput[];
  packages: readonly ServicePackageInput[];
}): ServiceItemValidationError | null {
  for (const [index, variation] of variations.entries()) {
    const position = index + 1;
    if (!variation.name.trim()) {
      return serviceItemError(
        "variation",
        index,
        "name",
        `Preencha o nome da opção ${position}.`,
      );
    }
    if (
      !Number.isInteger(variation.durationMinutes) ||
      variation.durationMinutes < 5 ||
      variation.durationMinutes > 1440
    ) {
      return serviceItemError(
        "variation",
        index,
        "durationMinutes",
        `A duração da opção ${position} deve ficar entre 5 minutos e 24 horas.`,
      );
    }
    if (!Number.isFinite(variation.price) || variation.price <= 0) {
      return serviceItemError(
        "variation",
        index,
        "price",
        `Informe um preço maior que zero para a opção ${position}.`,
      );
    }
  }

  for (const [index, addOn] of addOns.entries()) {
    const position = index + 1;
    if (!addOn.name.trim()) {
      return serviceItemError(
        "addOn",
        index,
        "name",
        `Preencha o nome do adicional ${position}.`,
      );
    }
    if (
      !Number.isInteger(addOn.durationMinutes) ||
      addOn.durationMinutes < 0 ||
      addOn.durationMinutes > 1440
    ) {
      return serviceItemError(
        "addOn",
        index,
        "durationMinutes",
        `Os minutos extras do adicional ${position} devem ficar entre 0 e 1440.`,
      );
    }
    if (!Number.isFinite(addOn.price) || addOn.price <= 0) {
      return serviceItemError(
        "addOn",
        index,
        "price",
        `Informe um valor maior que zero para o adicional ${position}.`,
      );
    }
  }

  for (const [index, servicePackage] of packages.entries()) {
    const position = index + 1;
    if (!servicePackage.name.trim()) {
      return serviceItemError(
        "package",
        index,
        "name",
        `Preencha o nome do pacote ${position}.`,
      );
    }
    if (
      !Number.isInteger(servicePackage.sessions) ||
      servicePackage.sessions < 2 ||
      servicePackage.sessions > 365
    ) {
      return serviceItemError(
        "package",
        index,
        "sessions",
        `O pacote ${position} deve ter entre 2 e 365 sessões.`,
      );
    }
    if (!Number.isFinite(servicePackage.price) || servicePackage.price <= 0) {
      return serviceItemError(
        "package",
        index,
        "price",
        `Informe um valor maior que zero para o pacote ${position}.`,
      );
    }
    if (
      !Number.isInteger(servicePackage.validityDays) ||
      servicePackage.validityDays < 1 ||
      servicePackage.validityDays > 3650
    ) {
      return serviceItemError(
        "package",
        index,
        "validityDays",
        `A validade do pacote ${position} deve ficar entre 1 e 3650 dias.`,
      );
    }
    if (
      servicePackage.recurrenceDays != null &&
      (!Number.isInteger(servicePackage.recurrenceDays) ||
        servicePackage.recurrenceDays < 1 ||
        servicePackage.recurrenceDays > 365)
    ) {
      return serviceItemError(
        "package",
        index,
        "recurrenceDays",
        `A repetição do pacote ${position} deve ficar entre 1 e 365 dias.`,
      );
    }
  }

  return null;
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
