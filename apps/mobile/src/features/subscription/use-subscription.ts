import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAvailablePurchases as fetchAvailablePurchases,
  useIAP,
  type ProductSubscription,
  type ProductSubscriptionAndroid,
  type Purchase,
} from "react-native-iap";

import { useAuth } from "../../shared/hooks/use-auth";
import { syncPlan } from "./api";
import { alertError } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";

type PremiumProductId = "lucrocaseiro_premium_monthly" | "lucrocaseiro_premium_annual";

const PRODUCT_IDS: Record<"monthly" | "annual", PremiumProductId> = {
  monthly: "lucrocaseiro_premium_monthly",
  annual: "lucrocaseiro_premium_annual",
};
const SUBSCRIPTION_PROFILE_KEY = ["subscription", "profile"] as const;
const SUBSCRIPTION_LIMITS_KEY = ["subscription", "limits"] as const;

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

function isPremiumProduct(productId: string): productId is PremiumProductId {
  return productId === PRODUCT_IDS.monthly || productId === PRODUCT_IDS.annual;
}

function resolvePremiumProductId(purchase: Purchase): PremiumProductId | null {
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

function isSyncablePremiumPurchase(purchase: Purchase): boolean {
  if (purchase.purchaseState && purchase.purchaseState !== "purchased") return false;
  if ("isSuspendedAndroid" in purchase && purchase.isSuspendedAndroid) return false;
  return resolvePremiumProductId(purchase) !== null;
}

function isAndroidSubscription(
  subscription: ProductSubscription,
): subscription is ProductSubscriptionAndroid {
  return subscription.platform === "android";
}

function getOfferToken(subscription: ProductSubscription): string | null {
  if (!isAndroidSubscription(subscription)) return null;

  return subscription.subscriptionOffers?.[0]?.offerTokenAndroid ?? null;
}

function getPurchaseToken(purchase: Purchase): string | null {
  if ("purchaseToken" in purchase) {
    return purchase.purchaseToken ?? null;
  }

  return null;
}

export function useSubscription() {
  const { token, userId } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const finishTransactionRef = useRef<
    ((args: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>) | null
  >(null);

  const verifyPurchase = useCallback(
    async (purchase: Purchase) => {
      const productId = resolvePremiumProductId(purchase);
      if (!token || Platform.OS !== "android" || !productId) {
        return false;
      }

      const purchaseToken = getPurchaseToken(purchase);
      if (!purchaseToken) return false;

      const profile = await syncPlan(token, {
        platform: "android",
        productId,
        purchaseToken,
      });
      queryClient.setQueryData(SUBSCRIPTION_PROFILE_KEY, profile);
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_LIMITS_KEY });
      await finishTransactionRef.current?.({ purchase, isConsumable: false });

      // A comemoracao (tela + confete) e disparada pelo watcher global de plano
      // no _layout, cobrindo tanto Google Play quanto Stripe.

      return true;
    },
    [token, queryClient],
  );

  const {
    connected,
    subscriptions,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      void verifyPurchase(purchase).finally(() => setLoading(false));
    },
    onPurchaseError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    finishTransactionRef.current = finishTransaction;
  }, [finishTransaction]);

  useEffect(() => {
    if (Platform.OS !== "android" || !connected) return;
    void fetchProducts({ skus: Object.values(PRODUCT_IDS), type: "subs" });
    void getAvailablePurchases({ includeSuspendedAndroid: false });
  }, [connected, fetchProducts, getAvailablePurchases]);

  useEffect(() => {
    if (!token || Platform.OS !== "android") return;

    for (const purchase of availablePurchases) {
      if (isSyncablePremiumPurchase(purchase)) {
        void verifyPurchase(purchase);
      }
    }
  }, [availablePurchases, token, verifyPurchase]);

  const subscribe = useCallback(
    async (period: "monthly" | "annual") => {
      if (Platform.OS !== "android") {
        showAlert({
          title: "Em breve",
          message: "Assinatura iOS será disponibilizada depois.",
        });
        return;
      }

      if (!token) {
        alertError("Faça login antes de assinar.");
        return;
      }

      const productId = PRODUCT_IDS[period];
      const subscription = subscriptions.find((item) => item.id === productId);
      const offerToken = subscription ? getOfferToken(subscription) : null;

      if (!connected || !subscription || !offerToken) {
        showAlert({
          title: "Plano indisponível",
          message:
            "Não foi possível carregar a assinatura do Google Play. Tente novamente.",
        });
        return;
      }

      setLoading(true);
      try {
        await requestPurchase({
          type: "subs",
          request: {
            google: {
              skus: [productId],
              obfuscatedAccountId: userId ?? undefined,
              subscriptionOffers: [{ sku: productId, offerToken }],
            },
          },
        });
      } catch {
        setLoading(false);
        alertError("Não foi possível iniciar a compra. Tente novamente.");
      }
    },
    [connected, requestPurchase, subscriptions, token, userId],
  );

  const restore = useCallback(async () => {
    if (Platform.OS !== "android") {
      showAlert({
        title: "Em breve",
        message: "Restauração iOS será disponibilizada depois.",
      });
      return;
    }

    if (!token) {
      alertError("Faça login antes de restaurar.");
      return;
    }

    setLoading(true);
    try {
      const purchases = await fetchAvailablePurchases({
        includeSuspendedAndroid: false,
      });
      await getAvailablePurchases({ includeSuspendedAndroid: false });

      const premiumPurchases = purchases.filter((purchase) =>
        isSyncablePremiumPurchase(purchase),
      );

      if (premiumPurchases.length === 0) {
        showAlert({
          title: "Nenhuma assinatura encontrada",
          message: "Não encontramos uma assinatura ativa vinculada a esta conta.",
        });
        return;
      }

      const restored = await Promise.all(
        premiumPurchases.map((purchase) => verifyPurchase(purchase)),
      );

      if (restored.some(Boolean)) {
        showAlert({
          title: "Restaurado!",
          message: "Sua assinatura Premium foi restaurada.",
        });
      }
    } catch {
      alertError("Não foi possível restaurar compras. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [getAvailablePurchases, token, verifyPurchase]);

  return { subscribe, restore, loading };
}
