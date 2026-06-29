import type { Purchase } from "react-native-iap";

export type PremiumProductId =
  | "lucrocaseiro_premium_monthly"
  | "lucrocaseiro_premium_annual";

export const PRODUCT_IDS: Record<"monthly" | "annual", PremiumProductId> = {
  monthly: "lucrocaseiro_premium_monthly",
  annual: "lucrocaseiro_premium_annual",
};

const PREMIUM_PRODUCT_IDS = new Set<string>([
  "lucrocaseiro_premium",
  "premium",
  PRODUCT_IDS.monthly,
  PRODUCT_IDS.annual,
]);

const PREMIUM_PLAN_IDS = new Set<string>([
  "monthly",
  "annual",
  "premium_monthly",
  "premium_annual",
  PRODUCT_IDS.monthly,
  PRODUCT_IDS.annual,
]);

type AndroidPurchaseState = Purchase & {
  readonly purchaseStateAndroid?: number | null;
};

function isPremiumProduct(productId: string): productId is PremiumProductId {
  return productId === PRODUCT_IDS.monthly || productId === PRODUCT_IDS.annual;
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

export function resolvePremiumProductId(purchase: Purchase): PremiumProductId | null {
  if (isPremiumProduct(purchase.productId)) return purchase.productId;

  const ids = purchase.ids ?? [];
  const knownId = ids.find(isPremiumProduct);
  if (knownId) return knownId;

  const planId = purchase.currentPlanId?.toLowerCase() ?? "";
  if (!PREMIUM_PRODUCT_IDS.has(purchase.productId) && !PREMIUM_PLAN_IDS.has(planId)) {
    return null;
  }

  if (planId.includes("annual") || planId.includes("year")) {
    return PRODUCT_IDS.annual;
  }

  return PRODUCT_IDS.monthly;
}

export function isSyncablePremiumPurchase(purchase: Purchase): boolean {
  if (!isPurchasedState(purchase as AndroidPurchaseState)) return false;
  if ("isSuspendedAndroid" in purchase && purchase.isSuspendedAndroid) return false;
  return resolvePremiumProductId(purchase) !== null;
}
