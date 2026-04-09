import type { FreemiumLimits } from "@lucro-caseiro/contracts";

import type { FreemiumConfig, ResourceCounts } from "./subscription.types";

export const FREE_PLAN_LIMITS: FreemiumConfig = {
  maxSalesPerMonth: 30,
  maxClients: 20,
  maxRecipes: 5,
  maxPackaging: 3,
};

export function buildFreemiumLimits(
  counts: ResourceCounts,
  isPremium: boolean,
): FreemiumLimits {
  if (isPremium) {
    return {
      maxSalesPerMonth: Infinity,
      maxClients: Infinity,
      maxRecipes: Infinity,
      maxPackaging: Infinity,
      currentSalesThisMonth: counts.salesThisMonth,
      currentClients: counts.clients,
      currentRecipes: counts.recipes,
      currentPackaging: counts.packaging,
    };
  }

  return {
    maxSalesPerMonth: FREE_PLAN_LIMITS.maxSalesPerMonth,
    maxClients: FREE_PLAN_LIMITS.maxClients,
    maxRecipes: FREE_PLAN_LIMITS.maxRecipes,
    maxPackaging: FREE_PLAN_LIMITS.maxPackaging,
    currentSalesThisMonth: counts.salesThisMonth,
    currentClients: counts.clients,
    currentRecipes: counts.recipes,
    currentPackaging: counts.packaging,
  };
}

export type ResourceType = "sales" | "clients" | "recipes" | "packaging";

export function isLimitExceeded(
  resourceType: ResourceType,
  counts: ResourceCounts,
): boolean {
  switch (resourceType) {
    case "sales":
      return counts.salesThisMonth >= FREE_PLAN_LIMITS.maxSalesPerMonth;
    case "clients":
      return counts.clients >= FREE_PLAN_LIMITS.maxClients;
    case "recipes":
      return counts.recipes >= FREE_PLAN_LIMITS.maxRecipes;
    case "packaging":
      return counts.packaging >= FREE_PLAN_LIMITS.maxPackaging;
  }
}

const LIMIT_MESSAGES: Record<ResourceType, string> = {
  sales: `Voce atingiu o limite de ${FREE_PLAN_LIMITS.maxSalesPerMonth} vendas por mes do plano gratuito. Assine o Premium para vendas ilimitadas!`,
  clients: `Voce atingiu o limite de ${FREE_PLAN_LIMITS.maxClients} clientes do plano gratuito. Assine o Premium para clientes ilimitados!`,
  recipes: `Voce atingiu o limite de ${FREE_PLAN_LIMITS.maxRecipes} receitas do plano gratuito. Assine o Premium para receitas ilimitadas!`,
  packaging: `Voce atingiu o limite de ${FREE_PLAN_LIMITS.maxPackaging} embalagens do plano gratuito. Assine o Premium para embalagens ilimitadas!`,
};

export function getLimitMessage(resourceType: ResourceType): string {
  return LIMIT_MESSAGES[resourceType];
}

export function isPremiumActive(plan: string, expiresAt: string | null): boolean {
  if (plan !== "premium") return false;
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}
