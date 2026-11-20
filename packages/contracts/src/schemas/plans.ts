import type { PlanType } from "./common";

// ---------------------------------------------------------------------------
// Matriz comercial dos planos (fonte única — API e mobile derivam daqui).
// Modelo (2026-11-15): Gratuito (degustação com limites) + um plano pago só, o
// **Premium**, com tudo liberado. No banco continuam existindo dois níveis pagos:
// "professional" é o que se vende; "essential" segue gravado pelo teste grátis de
// contas novas (trigger `handle_new_user`) e por assinaturas antigas, e agora vale
// exatamente o mesmo que o Premium. Ver docs/planos-comerciais.md.
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
  /** Encomendas novas por mês criadas no app (as que chegam pelo catálogo não contam). */
  readonly maxOrdersPerMonth: number | null;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    // Registrar vendas é o hábito diário do app: nunca trava no grátis.
    // O grátis limita o que cresce com o negócio (clientes, produtos...).
    maxSalesPerMonth: null,
    // 2026-11-15: apertado para o Premium valer a pena (ver docs/planos-comerciais.md).
    maxClients: 30,
    maxProducts: 15,
    maxRecipes: 5,
    maxPackaging: 3,
    maxSuppliers: 3,
    maxOrdersPerMonth: 5,
  },
  // Mesmo Premium (teste grátis e assinaturas antigas do Essencial).
  essential: {
    maxSalesPerMonth: null,
    maxClients: null,
    maxProducts: null,
    maxRecipes: null,
    maxPackaging: null,
    maxSuppliers: null,
    maxOrdersPerMonth: null,
  },
  professional: {
    maxSalesPerMonth: null,
    maxClients: null,
    maxProducts: null,
    maxRecipes: null,
    maxPackaging: null,
    maxSuppliers: null,
    maxOrdersPerMonth: null,
  },
};

// Produtos que a vitrine pública mostra no Gratuito (sem `catalogPremium`).
export const FREE_CATALOG_MAX_PRODUCTS = 5;

export type LimitResource =
  | "sales"
  | "clients"
  | "products"
  | "recipes"
  | "packaging"
  | "suppliers"
  | "orders";

const LIMIT_KEY: Record<LimitResource, keyof PlanLimits> = {
  sales: "maxSalesPerMonth",
  clients: "maxClients",
  products: "maxProducts",
  recipes: "maxRecipes",
  packaging: "maxPackaging",
  suppliers: "maxSuppliers",
  orders: "maxOrdersPerMonth",
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
  | "catalogPremium" // catálogo completo na vitrine (sem o teto do Gratuito)
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
  | "compositeProducts" // produtos compostos / kits
  | "fiado" // registrar venda nova no fiado, cobrar por link/Pix (dar baixa é sempre livre)
  | "financeHistory"; // Financeiro além da semana atual (meses e períodos anteriores)

// Gratuito (2026-11-15, revisão contra o Kyte): fica de graça o que faz a pessoa
// voltar todo dia (vendas, cálculo de preço, lembretes). PDFs, fiado, histórico
// do financeiro e agenda sem limite passam para o Premium.
const FREE_FEATURES: readonly PlanFeature[] = ["premiumNotifications"];

// Premium libera tudo: o que o Gratuito tem e o resto abaixo.
const PREMIUM_FEATURES: readonly PlanFeature[] = [
  ...FREE_FEATURES,
  "catalogPremium",
  "catalogCustomization",
  "extraPhotos",
  "advancedReports",
  "advancedPricing",
  "export",
  "purchases",
  "recurringExpenses",
  "labelsPremium",
  "prioritySupport",
  "compositeProducts",
  "exportBasic",
  "quotesPdf",
  "fiado",
  "financeHistory",
];

export const PLAN_FEATURES: Record<PlanType, ReadonlySet<PlanFeature>> = {
  free: new Set<PlanFeature>(FREE_FEATURES),
  essential: new Set<PlanFeature>(PREMIUM_FEATURES),
  professional: new Set<PlanFeature>(PREMIUM_FEATURES),
};

export function planHasFeature(plan: PlanType, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

/**
 * Plano efetivo: normaliza o valor persistido (aceita "premium" legado → professional)
 * e cai para "free" se a assinatura paga já expirou. Fonte única de "qual plano
 * vale agora" — todo gate de limite/feature deve passar por aqui.
 */
export function resolveActivePlan(
  plan: string,
  expiresAt: string | null,
  now: Date = new Date(),
): PlanType {
  const normalized = normalizePlan(plan);
  if (normalized === "free") return "free";
  if (expiresAt && new Date(expiresAt) <= now) return "free";
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
// Teste grátis (2026-11-20): toda conta NOVA começa no Gratuito. O teste de 7
// dias do Premium só começa quando a pessoa escolhe e coloca o cartão (Stripe
// com trial_period_days ou oferta de teste da Google Play); no fim do teste a
// loja cobra, a menos que a pessoa cancele antes. Uma vez por conta.
// O teste aparece no perfil como plano pago + plan_is_trial + plan_provider.
// plan_is_trial sem plan_provider é um período grátis sem cartão (teste antigo
// do cadastro ou prêmio de indicação), que termina sozinho pela data.
// ---------------------------------------------------------------------------

export const PREMIUM_TRIAL_DAYS = 7;

/** Estado de plano gravado ao criar uma conta nova: sempre o Gratuito. */
export function newAccountPlan(): {
  plan: "free";
  planExpiresAt: null;
  planIsTrial: false;
} {
  return { plan: "free", planExpiresAt: null, planIsTrial: false };
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

/** Período de teste do Premium ainda valendo (com ou sem cartão). */
export function isActiveTrial(
  plan: string,
  expiresAt: string | null,
  planIsTrial: boolean | undefined,
  now: Date = new Date(),
): boolean {
  return planIsTrial === true && resolveActivePlan(plan, expiresAt, now) !== "free";
}

/** Loja que cobra o plano atual. `null` = sem cobrança (Gratuito ou período grátis sem cartão). */
export type PlanProvider = "stripe" | "google_play";

/**
 * Período grátis SEM cartão ainda valendo (teste antigo do cadastro ou prêmio de
 * indicação): não há assinatura, acaba sozinho e volta para o Gratuito.
 */
export function isActiveFreePeriod(
  plan: string,
  expiresAt: string | null,
  planIsTrial: boolean | undefined,
  planProvider: PlanProvider | null | undefined,
  now: Date = new Date(),
): boolean {
  return !planProvider && isActiveTrial(plan, expiresAt, planIsTrial, now);
}

/** Teste COM cartão ainda valendo: a loja cobra no fim, a menos que a pessoa cancele. */
export function isActiveCardTrial(
  plan: string,
  expiresAt: string | null,
  planIsTrial: boolean | undefined,
  planProvider: PlanProvider | null | undefined,
  now: Date = new Date(),
): boolean {
  return !!planProvider && isActiveTrial(plan, expiresAt, planIsTrial, now);
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

/** O único plano à venda (Premium). Checkout e telas compram sempre este. */
export const SOLD_PLAN: PaidPlan = "professional";

// Premium: R$ 49,90/mês ou R$ 449/ano (R$ 37,42/mês). Os dois níveis têm o mesmo
// preço porque valem o mesmo (docs/planos-comerciais.md). Assinantes antigos
// seguem pagando o preço que contrataram, definido na loja (Stripe/Google Play).
const PREMIUM_PRICE: PlanPrice = { monthly: 49.9, annual: 449 };

export const PLAN_PRICING: Record<PaidPlan, PlanPrice> = {
  essential: PREMIUM_PRICE,
  professional: PREMIUM_PRICE,
};

export const PLAN_LABELS: Record<PlanType, string> = {
  free: "Gratuito",
  essential: "Premium",
  professional: "Premium",
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
