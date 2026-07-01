import type { FreemiumLimits, PlanType } from "@lucro-caseiro/contracts";
import {
  planLimit,
  PLAN_LIMITS,
  resolveActivePlan,
  type LimitResource,
} from "@lucro-caseiro/contracts";

import type { ResourceCounts } from "./subscription.types";

// Resolvedor de plano/feature vive em contracts (compartilhado com o mobile).
// Reexportado aqui como fachada da feature subscription para os callers da API.
export { hasActiveFeature } from "@lucro-caseiro/contracts";

export function resolvePlan(plan: string, expiresAt: string | null): PlanType {
  return resolveActivePlan(plan, expiresAt);
}

export function isPaidPlanActive(plan: string, expiresAt: string | null): boolean {
  return resolvePlan(plan, expiresAt) !== "free";
}

export function buildFreemiumLimits(
  counts: ResourceCounts,
  plan: PlanType,
): FreemiumLimits {
  const limits = PLAN_LIMITS[plan];
  return {
    maxSalesPerMonth: limits.maxSalesPerMonth,
    maxClients: limits.maxClients,
    maxRecipes: limits.maxRecipes,
    maxPackaging: limits.maxPackaging,
    maxProducts: limits.maxProducts,
    maxSuppliers: limits.maxSuppliers,
    currentSalesThisMonth: counts.salesThisMonth,
    currentClients: counts.clients,
    currentRecipes: counts.recipes,
    currentPackaging: counts.packaging,
    currentProducts: counts.products,
    currentSuppliers: counts.suppliers,
  };
}

export type ResourceType = LimitResource;

export function isLimitExceeded(
  resourceType: ResourceType,
  counts: ResourceCounts,
  plan: PlanType,
): boolean {
  const max = planLimit(plan, resourceType);
  if (max === null) return false;
  return currentCount(resourceType, counts) >= max;
}

function currentCount(resource: ResourceType, counts: ResourceCounts): number {
  switch (resource) {
    case "sales":
      return counts.salesThisMonth;
    case "clients":
      return counts.clients;
    case "recipes":
      return counts.recipes;
    case "packaging":
      return counts.packaging;
    case "products":
      return counts.products;
    case "suppliers":
      return counts.suppliers;
  }
}

const FREE = PLAN_LIMITS.free;

// Vendas/clientes/produtos/receitas/embalagens já ficam ilimitados no Essencial,
// então o upsell é para o Essencial. Fornecedores só liberam no Profissional.
const LIMIT_MESSAGES: Record<ResourceType, string> = {
  sales: `🚀 Você está vendendo muito! Chegou às ${FREE.maxSalesPerMonth} vendas do mês do plano gratuito. Assine o Essencial e tenha vendas ilimitadas.`,
  clients: `🤝 Sua carteira está crescendo! Você usou os ${FREE.maxClients} clientes do plano gratuito. Assine o Essencial para clientes ilimitados.`,
  recipes: `🧁 Suas receitas fazem sucesso! Você atingiu as ${FREE.maxRecipes} receitas do plano gratuito. Assine o Essencial para receitas ilimitadas.`,
  packaging: `📦 Você atingiu as ${FREE.maxPackaging} embalagens do plano gratuito. Assine o Essencial para embalagens ilimitadas.`,
  products: `🎉 Sua loja está crescendo! Você usou os ${FREE.maxProducts} produtos do plano gratuito. Assine o Essencial e expanda seu catálogo sem limites.`,
  suppliers: `🤝 Você atingiu os ${FREE.maxSuppliers} fornecedores. Fornecedores ilimitados e controle de compras fazem parte do plano Profissional.`,
};

export function getLimitMessage(resourceType: ResourceType): string {
  return LIMIT_MESSAGES[resourceType];
}
