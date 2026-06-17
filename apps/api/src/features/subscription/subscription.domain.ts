import type { FreemiumLimits } from "@lucro-caseiro/contracts";

import type { FreemiumConfig, ResourceCounts } from "./subscription.types";

export const FREE_PLAN_LIMITS: FreemiumConfig = {
  // Free enxuto: limites que mordem cedo (gatilho de conversão) e mantêm o custo
  // de servir baixo. O caro (catálogo público, exportação, relatórios completos)
  // fica no Premium; aqui ficam só as contagens.
  maxSalesPerMonth: 50,
  maxClients: 20,
  maxRecipes: 5,
  maxPackaging: 3,
  maxProducts: 15,
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
  sales: `🚀 Você está vendendo muito! Chegou às ${FREE_PLAN_LIMITS.maxSalesPerMonth} vendas do mês no plano gratuito. Desbloqueie vendas ilimitadas no Premium.`,
  clients: `🤝 Sua carteira de clientes está crescendo! Você usou os ${FREE_PLAN_LIMITS.maxClients} clientes do plano gratuito. Faça upgrade para clientes ilimitados.`,
  recipes: `🧁 Suas receitas estão fazendo sucesso! Você atingiu as ${FREE_PLAN_LIMITS.maxRecipes} receitas do plano gratuito. Desbloqueie receitas ilimitadas e continue crescendo.`,
  packaging: `📦 Você atingiu as ${FREE_PLAN_LIMITS.maxPackaging} embalagens do plano gratuito. Desbloqueie embalagens e rótulos ilimitados no Premium.`,
  products: `🎉 Sua loja está crescendo! Você usou os ${FREE_PLAN_LIMITS.maxProducts} produtos do plano gratuito. Desbloqueie produtos ilimitados e expanda seu catálogo.`,
};

export function getLimitMessage(resourceType: ResourceType): string {
  return LIMIT_MESSAGES[resourceType];
}

export function isPremiumActive(plan: string, expiresAt: string | null): boolean {
  if (plan !== "premium") return false;
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}
