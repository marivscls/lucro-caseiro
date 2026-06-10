import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  useIAP,
  type ProductSubscription,
  type ProductSubscriptionAndroid,
  type Purchase,
} from "react-native-iap";

import { useAuth } from "../../shared/hooks/use-auth";
import { syncPlan } from "./api";
import { alertError } from "../../shared/utils/alerts";

type PremiumProductId = "lucrocaseiro_premium_monthly" | "lucrocaseiro_premium_annual";

const PRODUCT_IDS: Record<"monthly" | "annual", PremiumProductId> = {
  monthly: "lucrocaseiro_premium_monthly",
  annual: "lucrocaseiro_premium_annual",
};

function isPremiumProduct(productId: string): productId is PremiumProductId {
  return productId === PRODUCT_IDS.monthly || productId === PRODUCT_IDS.annual;
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
      if (!token || Platform.OS !== "android" || !isPremiumProduct(purchase.productId)) {
        return false;
      }

      const purchaseToken = getPurchaseToken(purchase);
      if (!purchaseToken) return false;

      await syncPlan(token, {
        platform: "android",
        productId: purchase.productId,
        purchaseToken,
      });
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
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
      if (isPremiumProduct(purchase.productId)) {
        void verifyPurchase(purchase);
      }
    }
  }, [availablePurchases, token, verifyPurchase]);

  const subscribe = useCallback(
    async (period: "monthly" | "annual") => {
      if (Platform.OS !== "android") {
        Alert.alert("Em breve", "Assinatura iOS será disponibilizada depois.");
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
        Alert.alert(
          "Plano indisponível",
          "Não foi possível carregar a assinatura do Google Play. Tente novamente.",
        );
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
      Alert.alert("Em breve", "Restauração iOS será disponibilizada depois.");
      return;
    }

    if (!token) {
      alertError("Faça login antes de restaurar.");
      return;
    }

    setLoading(true);
    try {
      await getAvailablePurchases({ includeSuspendedAndroid: false });
      const premiumPurchases = availablePurchases.filter((purchase) =>
        isPremiumProduct(purchase.productId),
      );

      if (premiumPurchases.length === 0) {
        Alert.alert(
          "Nenhuma assinatura encontrada",
          "Não encontramos uma assinatura ativa vinculada a esta conta.",
        );
        return;
      }

      const restored = await Promise.all(
        premiumPurchases.map((purchase) => verifyPurchase(purchase)),
      );

      if (restored.some(Boolean)) {
        Alert.alert("Restaurado!", "Sua assinatura Premium foi restaurada.");
      }
    } catch {
      alertError("Não foi possível restaurar compras. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [availablePurchases, getAvailablePurchases, token, verifyPurchase]);

  return { subscribe, restore, loading };
}
