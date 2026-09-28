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
    // Registrar vendas é o hábito diário do app: nunca trava no grátis.
    // O grátis limita o que cresce com o negócio (clientes, produtos...).
    maxSalesPerMonth: null,
    maxClients: 50,
    maxProducts: 30,
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
// Features qualitativas (gate por plano, além dos limites de contagem).
// ---------------------------------------------------------------------------

export type PlanFeature =
  | "exportBasic" // exportar resumo mensal em PDF simples (fechamento do mês)
  | "extraPhotos" // várias fotos por produto
  | "catalogPremium" // catálogo completo na vitrine (sem teto de 3 produtos)
  | "catalogCustomization" // capa/cor/logo/frase/banner do catálogo público
  | "advancedReports" // relatórios completos com gráficos (insights)
  | "advancedPricing" // precificação completa com premissas detalhadas
  | "export" // exportar PDF/XLSX completo (relatórios avançados, histórico)
  | "purchases" // registrar compras de fornecedores
  | "recurringExpenses" // gastos recorrentes
  | "labelsPremium" // rótulos personalizados
  | "quotesPdf" // orçamentos em PDF
  | "premiumNotifications" // aniversários, lembretes diários e resumo semanal
  | "prioritySupport" // atendimento prioritário
  | "compositeProducts"; // produtos compostos / kits

// Essencial libera o operacional diário, o catálogo completo com galeria e o
// PDF básico do resumo mensal (ADR-0005).
const ESSENTIAL_FEATURES: readonly PlanFeature[] = [
  "exportBasic",
  "catalogPremium",
  "catalogCustomization",
  "extraPhotos",
];

const PROFESSIONAL_FEATURES: readonly PlanFeature[] = [
  "advancedReports",
  "advancedPricing",
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

// ---------------------------------------------------------------------------
// Teste grátis: toda conta NOVA ganha o Essencial por 7 dias, sem cartão.
// Persistido como plan='essential' + plan_expires_at=criação+7d + plan_is_trial;
// ao expirar, resolveActivePlan já devolve "free" (nada a desligar).
// ---------------------------------------------------------------------------

export const ESSENTIAL_TRIAL_DAYS = 7;

/** Estado de plano gravado ao criar uma conta nova (teste do Essencial). */
export function newAccountTrialPlan(now: Date = new Date()): {
  plan: "essential";
  planExpiresAt: Date;
  planIsTrial: true;
} {
  return {
    plan: "essential",
    planExpiresAt: new Date(now.getTime() + ESSENTIAL_TRIAL_DAYS * 24 * 60 * 60 * 1000),
    planIsTrial: true,
  };
}

/**
 * Dias de calendário (fuso local) até o fim do teste: 0 = termina hoje,
 * 1 = amanhã... `null` quando não há data ou o teste já acabou.
 */
export function trialDaysLeft(
  expiresAt: string | null,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  if (end.getTime() <= now.getTime()) return null;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(end) - startOfDay(now)) / (24 * 60 * 60 * 1000));
}

/** Teste do Essencial ainda valendo (plano pago em teste e não expirado). */
export function isActiveTrial(
  plan: string,
  expiresAt: string | null,
  planIsTrial: boolean | undefined,
): boolean {
  return planIsTrial === true && resolveActivePlan(plan, expiresAt) !== "free";
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
