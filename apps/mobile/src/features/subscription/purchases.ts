import type { BillingPeriod, PaidPlan, StoreProductId } from "@lucro-caseiro/contracts";
import {
  isActiveFreePeriod,
  planFromProductId,
  resolveActivePlan,
  STORE_PRODUCT_IDS,
} from "@lucro-caseiro/contracts";
import type { ProductSubscription, Purchase, SubscriptionOffer } from "react-native-iap";

// Product ids aceitos pelo backend (4 novos SKUs + os legados do Premium).
export type AcceptedProductId =
  | StoreProductId
  | "lucrocaseiro_premium_monthly"
  | "lucrocaseiro_premium_annual";

export const ALL_PRODUCT_IDS: StoreProductId[] = [
  STORE_PRODUCT_IDS.essential.monthly,
  STORE_PRODUCT_IDS.essential.annual,
  STORE_PRODUCT_IDS.professional.monthly,
  STORE_PRODUCT_IDS.professional.annual,
];

const ACCEPTED_PRODUCT_IDS = new Set<string>([
  ...ALL_PRODUCT_IDS,
  "lucrocaseiro_premium_monthly",
  "lucrocaseiro_premium_annual",
]);

export function productIdFor(tier: PaidPlan, period: BillingPeriod): StoreProductId {
  return STORE_PRODUCT_IDS[tier][period];
}

type AndroidPurchaseState = Purchase & {
  readonly purchaseStateAndroid?: number | null;
};

function accepted(id: string | undefined | null): AcceptedProductId | null {
  return id && ACCEPTED_PRODUCT_IDS.has(id) ? (id as AcceptedProductId) : null;
}

function isPurchasedState(purchase: AndroidPurchaseState): boolean {
  if (purchase.purchaseState === "purchased") return true;
  if (purchase.purchaseState === "pending") return false;

  // react-native-iap normaliza para string, mas versões/camadas Android também
  // expõem o enum nativo: 1 = purchased, 2 = pending.
  if (purchase.purchaseStateAndroid != null) {
    return purchase.purchaseStateAndroid === 1;
  }

  return false;
}

/**
 * Product id (aceito pelo backend) da compra. Tenta o productId direto e os
 * `ids`; se só vier o basePlan/currentPlanId, deriva tier+period e monta o SKU.
 * O backend re-verifica a assinatura no Google Play, então o importante é enviar
 * um id válido + o token.
 */
export function resolvePaidProductId(purchase: Purchase): AcceptedProductId | null {
  const direct = accepted(purchase.productId);
  if (direct) return direct;

  const fromIds = (purchase.ids ?? []).map(accepted).find(Boolean);
  if (fromIds) return fromIds;

  const planId = (purchase.currentPlanId ?? "").toLowerCase();
  const tier = planFromProductId(planId) ?? planFromProductId(purchase.productId ?? "");
  if (tier) {
    const period: BillingPeriod =
      planId.includes("annual") || planId.includes("year") ? "annual" : "monthly";
    return STORE_PRODUCT_IDS[tier][period];
  }

  return null;
}

export function isSyncablePaidPurchase(purchase: Purchase): boolean {
  if (!isPurchasedState(purchase as AndroidPurchaseState)) return false;
  if ("isSuspendedAndroid" in purchase && purchase.isSuspendedAndroid) return false;
  return resolvePaidProductId(purchase) !== null;
}

type ActivationProfile = {
  plan: string;
  planExpiresAt: string | null;
  planIsTrial?: boolean;
  planProvider?: "stripe" | "google_play" | null;
};

const PLAN_RANK: Record<PaidPlan, number> = { essential: 1, professional: 2 };

/**
 * A compra só conta como liberada quando o perfil devolvido pelo servidor já
 * está num plano pago igual ou acima do que foi comprado. O teste com cartão da
 * loja conta (é uma assinatura); um período grátis sem cartão não conta.
 * Enquanto o Google deixa o pagamento "pendente", o servidor devolve o plano
 * anterior; nesse caso a compra não é confirmada e a pessoa é avisada.
 */
export function isPurchaseActivated(
  profile: ActivationProfile,
  productId: AcceptedProductId,
  now: Date = new Date(),
): boolean {
  const purchased = planFromProductId(productId);
  if (!purchased) return false;
  if (
    isActiveFreePeriod(
      profile.plan,
      profile.planExpiresAt,
      profile.planIsTrial,
      profile.planProvider,
      now,
    )
  ) {
    return false;
  }
  const active = resolveActivePlan(profile.plan, profile.planExpiresAt, now);
  if (active === "free") return false;
  return PLAN_RANK[active] >= PLAN_RANK[purchased];
}

export type PurchaseResult = "success" | "failure" | "cancel";

/** Cancelamento pela pessoa (react-native-iap usa `user-cancelled`; versões antigas, `E_USER_CANCELLED`). */
export function purchaseErrorResult(error: unknown): Exclude<PurchaseResult, "success"> {
  const code =
    error && typeof error === "object" && "code" in error ? String(error.code) : "";
  return /cancel/i.test(code) ? "cancel" : "failure";
}

function offersOf(subscription: ProductSubscription): SubscriptionOffer[] {
  if (subscription.platform !== "android") return [];
  return subscription.subscriptionOffers ?? [];
}

/** Oferta com uma fase grátis (o teste de 7 dias configurado no Play Console). */
export function isFreeTrialOffer(offer: SubscriptionOffer): boolean {
  if (offer.paymentMode === "free-trial") return true;
  const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
  return phases.some((phase) => Number(phase.priceAmountMicros) === 0);
}

/**
 * A Google Play só lista a oferta de teste para quem ainda pode usá-la (por
 * conta Google), então a presença dela já é a elegibilidade da loja.
 */
export function hasFreeTrialOffer(
  subscription: ProductSubscription | undefined,
): boolean {
  if (!subscription) return false;
  return offersOf(subscription).some(
    (offer) => isFreeTrialOffer(offer) && Boolean(offer.offerTokenAndroid),
  );
}

/**
 * Token da oferta a comprar: com teste, a oferta de teste grátis; sem teste, o
 * plano base (sem fase grátis), para ninguém cair num teste sem ter escolhido.
 */
export function pickOfferToken(
  subscription: ProductSubscription,
  withTrial: boolean,
): string | null {
  const offers = offersOf(subscription).filter((offer) => offer.offerTokenAndroid);
  const match = offers.find((offer) => isFreeTrialOffer(offer) === withTrial);
  return match?.offerTokenAndroid ?? null;
}
