import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ProductSubscription,
  ProductSubscriptionAndroid,
  Purchase,
} from "react-native-iap";

import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";

import { useAuth } from "../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../analytics/tracker";
import { syncPlan } from "./api";
import { alertError } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";
import {
  ALL_PRODUCT_IDS,
  isSyncablePaidPurchase,
  productIdFor,
  resolvePaidProductId,
} from "./purchases";

const SUBSCRIPTION_PROFILE_KEY = ["subscription", "profile"] as const;
const SUBSCRIPTION_LIMITS_KEY = ["subscription", "limits"] as const;

type IapHookArgs = {
  onPurchaseSuccess: (purchase: Purchase) => void;
  onPurchaseError: () => void;
};

type IapHookResult = {
  connected: boolean;
  subscriptions: ProductSubscription[];
  availablePurchases: Purchase[];
  fetchProducts: (args: { skus: string[]; type: "subs" }) => Promise<void>;
  requestPurchase: (args: {
    type: "subs";
    request: {
      google: {
        skus: string[];
        obfuscatedAccountId?: string;
        subscriptionOffers: { sku: string; offerToken: string }[];
      };
    };
  }) => Promise<void>;
  finishTransaction: (args: {
    purchase: Purchase;
    isConsumable?: boolean;
  }) => Promise<void>;
  getAvailablePurchases: (args: {
    includeSuspendedAndroid: boolean;
  }) => Promise<Purchase[]>;
};

type IapModule = {
  useIAP: (args: IapHookArgs) => IapHookResult;
  getAvailablePurchases: (args: {
    includeSuspendedAndroid: boolean;
  }) => Promise<Purchase[]>;
};

function unavailableIap(): IapHookResult {
  return {
    connected: false,
    subscriptions: [],
    availablePurchases: [],
    fetchProducts: () => Promise.resolve(),
    requestPurchase: () => Promise.resolve(),
    finishTransaction: () => Promise.resolve(),
    getAvailablePurchases: () => Promise.resolve([]),
  };
}

function loadIapModule(): IapModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy native load keeps stale dev builds from crashing on startup.
    return require("react-native-iap") as IapModule;
  } catch {
    return null;
  }
}

const iapModule = loadIapModule();
const useSafeIAP = iapModule?.useIAP ?? (() => unavailableIap());
const fetchAvailablePurchases =
  iapModule?.getAvailablePurchases ?? (() => Promise.resolve([] as Purchase[]));

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
      const productId = resolvePaidProductId(purchase);
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

  const syncPaidPurchases = useCallback(
    async (purchases: Purchase[]) => {
      const paidPurchases = purchases.filter((purchase) =>
        isSyncablePaidPurchase(purchase),
      );
      if (paidPurchases.length === 0) return false;

      const synced = await Promise.all(
        paidPurchases.map((purchase) => verifyPurchase(purchase)),
      );
      return synced.some(Boolean);
    },
    [verifyPurchase],
  );

  const {
    connected,
    subscriptions,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    getAvailablePurchases,
  } = useSafeIAP({
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

  // Rede de segurança: o Google nem sempre devolve o callback de compra
  // (cancelada/reembolsada/já possuída). Sem isso o botão fica em loading
  // infinito. Se seguir carregando por 45s, libera o botão de volta.
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => setLoading(false), 45000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!token || Platform.OS !== "android" || !connected) return;
    void fetchProducts({ skus: [...ALL_PRODUCT_IDS], type: "subs" });
    void getAvailablePurchases({ includeSuspendedAndroid: false })
      .then(syncPaidPurchases)
      .catch(() => {});
  }, [connected, fetchProducts, getAvailablePurchases, syncPaidPurchases, token]);

  useEffect(() => {
    if (!token || Platform.OS !== "android") return;

    void syncPaidPurchases(availablePurchases);
  }, [availablePurchases, token, syncPaidPurchases]);

  const subscribe = useCallback(
    async (tier: PaidPlan, period: BillingPeriod) => {
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

      const productId = productIdFor(tier, period);
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
        void trackAnalyticsAction("subscription_started", token);
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

      const paidPurchases = purchases.filter((purchase) =>
        isSyncablePaidPurchase(purchase),
      );

      if (paidPurchases.length === 0) {
        showAlert({
          title: "Nenhuma assinatura encontrada",
          message: "Não encontramos uma assinatura ativa vinculada a esta conta.",
        });
        return;
      }

      if (await syncPaidPurchases(paidPurchases)) {
        showAlert({
          title: "Restaurado!",
          message: "Sua assinatura foi restaurada.",
        });
      }
    } catch {
      alertError("Não foi possível restaurar compras. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [getAvailablePurchases, syncPaidPurchases, token]);

  return { subscribe, restore, loading };
}
