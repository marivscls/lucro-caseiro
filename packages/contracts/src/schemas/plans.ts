import type { PlanType } from "./common";

// ---------------------------------------------------------------------------
// Matriz comercial dos planos (fonte única — API e mobile derivam daqui).
// Modelo: free (degustação com limites) · essential (uso real sem limites de
// volume) · professional (apresentação + controle avançado + exportação).
// Ver docs/planos-comerciais.md.
// ---------------------------------------------------------------------------

// Limites de contagem por plano. `null` = ilimitado (sobrevive ao JSON; NÃO use
// Infinity, que vira null e já causou banner de "limite atingido" no premium).
export interface PlanLimits {
  readonly maxSalesPerMonth: number | null;
  readonly maxClients: number | null;
  readonly maxProducts: number | null;
  readonly maxRecipes: number | null;
  readonly maxPackaging: number | null;
  readonly maxSuppliers: number | null;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxSalesPerMonth: 30,
    maxClients: 20,
    maxProducts: 15,
    maxRecipes: 5,
    maxPackaging: 3,
    maxSuppliers: 3,
  },
  essential: {
    // Essencial remove os limites de volume do dia a dia.
    maxSalesPerMonth: null,
    maxClients: null,
    maxProducts: null,
    maxRecipes: null,
    maxPackaging: null,
    // Fornecedores/Compras são diferenciais do Profissional: no Essencial o teto
    // segue igual ao free (dados antigos continuam visíveis, só não passa de 3).
    maxSuppliers: 3,
  },
  professional: {
    maxSalesPerMonth: null,
    maxClients: null,
    maxProducts: null,
    maxRecipes: null,
    maxPackaging: null,
    maxSuppliers: null,
  },
};

export type LimitResource =
  | "sales"
  | "clients"
  | "products"
  | "recipes"
  | "packaging"
  | "suppliers";

const LIMIT_KEY: Record<LimitResource, keyof PlanLimits> = {
  sales: "maxSalesPerMonth",
  clients: "maxClients",
  products: "maxProducts",
  recipes: "maxRecipes",
  packaging: "maxPackaging",
  suppliers: "maxSuppliers",
};

export function planLimit(plan: PlanType, resource: LimitResource): number | null {
  return PLAN_LIMITS[plan][LIMIT_KEY[resource]];
}

// ---------------------------------------------------------------------------
// Features premium (gate por plano, além dos limites de contagem).
// ---------------------------------------------------------------------------

export type PlanFeature =
  | "exportBasic" // exportar resumo mensal em PDF simples (fechamento do mês)
  | "extraPhotos" // várias fotos por produto
  | "catalogPremium" // catálogo completo na vitrine (sem teto de 3 produtos)
  | "catalogCustomization" // capa/cor/logo/frase/banner do catálogo público
  | "advancedReports" // relatórios completos com gráficos (insights)
  | "export" // exportar PDF/XLSX completo (relatórios avançados, histórico)
  | "purchases" // registrar compras de fornecedores
  | "recurringExpenses" // gastos recorrentes
  | "labelsPremium" // rótulos personalizados
  | "quotesPdf" // orçamentos em PDF
  | "premiumNotifications" // aniversários, lembretes diários e resumo semanal
  | "prioritySupport" // atendimento prioritário
  | "compositeProducts"; // produtos compostos / kits

// Essencial ganha 1 diferencial qualitativo sobre o free: PDF básico do resumo
// mensal (ADR-0005). Toda outra feature premium segue exclusiva do Profissional.
const ESSENTIAL_FEATURES: readonly PlanFeature[] = ["exportBasic"];

const PROFESSIONAL_FEATURES: readonly PlanFeature[] = [
  "extraPhotos",
  "catalogPremium",
  "catalogCustomization",
  "advancedReports",
  "export",
  "purchases",
  "recurringExpenses",
  "labelsPremium",
  "quotesPdf",
  "premiumNotifications",
  "prioritySupport",
  "compositeProducts",
];

export const PLAN_FEATURES: Record<PlanType, ReadonlySet<PlanFeature>> = {
  free: new Set<PlanFeature>(),
  essential: new Set<PlanFeature>(ESSENTIAL_FEATURES),
  professional: new Set<PlanFeature>([...ESSENTIAL_FEATURES, ...PROFESSIONAL_FEATURES]),
};

export function planHasFeature(plan: PlanType, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

/**
 * Plano efetivo: normaliza o valor persistido (aceita "premium" legado → professional)
 * e cai para "free" se a assinatura paga já expirou. Fonte única de "qual plano
 * vale agora" — todo gate de limite/feature deve passar por aqui.
 */
export function resolveActivePlan(plan: string, expiresAt: string | null): PlanType {
  const normalized = normalizePlan(plan);
  if (normalized === "free") return "free";
  if (expiresAt && new Date(expiresAt) <= new Date()) return "free";
  return normalized;
}

export function hasActiveFeature(
  plan: string,
  expiresAt: string | null,
  feature: PlanFeature,
): boolean {
  return planHasFeature(resolveActivePlan(plan, expiresAt), feature);
}

export function isPaidPlan(plan: PlanType): plan is PaidPlan {
  return plan === "essential" || plan === "professional";
}

// ---------------------------------------------------------------------------
// Preços e catálogo de produtos das lojas (billing).
// ---------------------------------------------------------------------------

export type PaidPlan = "essential" | "professional";
export type BillingPeriod = "monthly" | "annual";

export interface PlanPrice {
  readonly monthly: number;
  readonly annual: number;
}

// Anual = ~2 meses grátis (docs/planos-comerciais.md).
export const PLAN_PRICING: Record<PaidPlan, PlanPrice> = {
  essential: { monthly: 29.9, annual: 299 },
  professional: { monthly: 69.9, annual: 699 },
};

export const PLAN_LABELS: Record<PlanType, string> = {
  free: "Gratuito",
  essential: "Essencial",
  professional: "Profissional",
};

export type StoreProductId =
  | "lucrocaseiro_essential_monthly"
  | "lucrocaseiro_essential_annual"
  | "lucrocaseiro_professional_monthly"
  | "lucrocaseiro_professional_annual";

export const STORE_PRODUCT_IDS: Record<
  PaidPlan,
  Record<BillingPeriod, StoreProductId>
> = {
  essential: {
    monthly: "lucrocaseiro_essential_monthly",
    annual: "lucrocaseiro_essential_annual",
  },
  professional: {
    monthly: "lucrocaseiro_professional_monthly",
    annual: "lucrocaseiro_professional_annual",
  },
};

// Mapa product-id → plano pago. Inclui os SKUs legados do Premium antigo, que
// migram para o Profissional (assinante que já pagava não perde nada).
const PRODUCT_TO_PLAN: Record<string, PaidPlan> = {
  lucrocaseiro_essential_monthly: "essential",
  lucrocaseiro_essential_annual: "essential",
  lucrocaseiro_professional_monthly: "professional",
  lucrocaseiro_professional_annual: "professional",
  lucrocaseiro_premium_monthly: "professional",
  lucrocaseiro_premium_annual: "professional",
  lucrocaseiro_premium: "professional",
  premium: "professional",
};

export function planFromProductId(productId: string): PaidPlan | null {
  return PRODUCT_TO_PLAN[productId] ?? null;
}

// Normaliza um valor de plano vindo do banco/legado ("premium" → professional).
export function normalizePlan(plan: string): PlanType {
  if (plan === "free" || plan === "essential" || plan === "professional") return plan;
  if (plan === "premium") return "professional";
  return "free";
}
