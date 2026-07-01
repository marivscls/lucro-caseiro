import type { BillingPeriod, PaidPlan, StoreProductId } from "@lucro-caseiro/contracts";
import { planFromProductId, STORE_PRODUCT_IDS } from "@lucro-caseiro/contracts";
import type { Purchase } from "react-native-iap";

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
