import type { FreemiumLimits } from "@lucro-caseiro/contracts";

import type { FreemiumConfig, ResourceCounts } from "./subscription.types";

export const FREE_PLAN_LIMITS: FreemiumConfig = {
  // Vendas: teto alto (200/mês ≈ 7/dia) — folgado o bastante pra não atrapalhar o
  // uso diário (registrar venda é a ação central), mas finito: gatilho suave pra
  // quem vende muito + barreira contra abuso. O free fica "básico" pelos outros
  // limites (clientes/produtos/receitas/embalagens) + as features Premium.
  maxSalesPerMonth: 200,
  maxClients: 20,
  maxRecipes: 5,
  maxPackaging: 3,
  maxProducts: 20,
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
      maxProducts: Infinity,
      currentSalesThisMonth: counts.salesThisMonth,
      currentClients: counts.clients,
      currentRecipes: counts.recipes,
      currentPackaging: counts.packaging,
      currentProducts: counts.products,
    };
  }

  return {
    maxSalesPerMonth: FREE_PLAN_LIMITS.maxSalesPerMonth,
    maxClients: FREE_PLAN_LIMITS.maxClients,
    maxRecipes: FREE_PLAN_LIMITS.maxRecipes,
    maxPackaging: FREE_PLAN_LIMITS.maxPackaging,
    maxProducts: FREE_PLAN_LIMITS.maxProducts,
    currentSalesThisMonth: counts.salesThisMonth,
    currentClients: counts.clients,
    currentRecipes: counts.recipes,
    currentPackaging: counts.packaging,
    currentProducts: counts.products,
  };
}

export type ResourceType = "sales" | "clients" | "recipes" | "packaging" | "products";

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
    case "products":
      return counts.products >= FREE_PLAN_LIMITS.maxProducts;
  }
}

const LIMIT_MESSAGES: Record<ResourceType, string> = {
  sales: `Você atingiu o limite de ${FREE_PLAN_LIMITS.maxSalesPerMonth} vendas por mês do plano gratuito. Assine o Premium para vendas ilimitadas!`,
  clients: `Você atingiu o limite de ${FREE_PLAN_LIMITS.maxClients} clientes do plano gratuito. Assine o Premium para clientes ilimitados!`,
  recipes: `Você atingiu o limite de ${FREE_PLAN_LIMITS.maxRecipes} receitas do plano gratuito. Assine o Premium para receitas ilimitadas!`,
  packaging: `Você atingiu o limite de ${FREE_PLAN_LIMITS.maxPackaging} embalagens do plano gratuito. Assine o Premium para embalagens ilimitadas!`,
  products: `Você atingiu o limite de ${FREE_PLAN_LIMITS.maxProducts} produtos do plano gratuito. Assine o Premium para produtos ilimitados!`,
};

export function getLimitMessage(resourceType: ResourceType): string {
  return LIMIT_MESSAGES[resourceType];
}

export function isPremiumActive(plan: string, expiresAt: string | null): boolean {
  if (plan !== "premium") return false;
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}
