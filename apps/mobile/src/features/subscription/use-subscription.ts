import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { ProductSubscription, Purchase } from "react-native-iap";

import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";

import { isMockMode } from "../../shared/mock/mode";
import { useAuth } from "../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../analytics/tracker";
import { fetchProfile, syncPlan } from "./api";
import { isProfilePremiumActive } from "./hooks";
import { isProfileOnTrial } from "./trial";
import { alertError } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";
import {
  ALL_PRODUCT_IDS,
  hasFreeTrialOffer,
  isPurchaseActivated,
  pickOfferToken,
  isSyncablePaidPurchase,
  productIdFor,
  purchaseErrorResult,
  type PurchaseResult,
  resolvePaidProductId,
} from "./purchases";

const SUBSCRIPTION_PROFILE_KEY = ["subscription", "profile"] as const;
const SUBSCRIPTION_LIMITS_KEY = ["subscription", "limits"] as const;

/** Novas tentativas depois da compra (~2 min no total), para pagamento pendente. */
export const PURCHASE_RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000];

export const PURCHASE_PENDING_ALERT = {
  title: "Pagamento em confirmação",
  message:
    "O Google ainda está confirmando seu pagamento. Assim que for aprovado, seu plano é liberado sozinho. Se não liberar em alguns minutos, toque em Restaurar compras ou fale com o suporte. Você não paga nada se o plano não for liberado.",
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type IapHookArgs = {
  onPurchaseSuccess: (purchase: Purchase) => void;
  onPurchaseError: (error?: unknown) => void;
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
  // Modo demonstração: compras na loja desativadas.
  if (isMockMode) return null;
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
  // Compra iniciada nesta sessão; compras pendentes antigas não geram purchase_result.
  const pendingPurchase = useRef<{ plan: PaidPlan; period: BillingPeriod } | null>(null);
  const reportPurchase = useCallback(
    (result: PurchaseResult) => {
      const pending = pendingPurchase.current;
      if (!pending) return;
      pendingPurchase.current = null;
      void trackAnalyticsAction("purchase_result", token, {
        result,
        provider: "google_play",
        plan: pending.plan,
        period: pending.period,
      });
    },
    [token],
  );
  const finishTransactionRef = useRef<
    ((args: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>) | null
  >(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Envia a compra ao servidor e só a confirma no Google quando o plano foi
   * liberado de verdade. Compra não confirmada é devolvida pelo Google em 3
   * dias, então nunca confirmamos um pagamento que não liberou o plano.
   */
  const verifyPurchase = useCallback(
    async (purchase: Purchase): Promise<boolean> => {
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
      queryClient.setQueryData([...SUBSCRIPTION_PROFILE_KEY, profile.id], profile);
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_LIMITS_KEY });

      if (!isPurchaseActivated(profile, productId)) return false;

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
        paidPurchases.map((purchase) => verifyPurchase(purchase).catch(() => false)),
      );
      return synced.some(Boolean);
    },
    [verifyPurchase],
  );

  /**
   * Compra recém-feita: o Google pode deixar o pagamento "pendente" por alguns
   * minutos. Tenta de novo em segundo plano e avisa a pessoa se não liberou
   * na primeira tentativa, em vez de ficar em silêncio.
   */
  const activateNewPurchase = useCallback(
    async (purchase: Purchase) => {
      let warned = false;
      for (let attempt = 0; attempt <= PURCHASE_RETRY_DELAYS_MS.length; attempt += 1) {
        if (attempt > 0) {
          await wait(PURCHASE_RETRY_DELAYS_MS[attempt - 1]);
          if (!mounted.current) return;
        }

        const activated = await verifyPurchase(purchase).catch(() => false);
        if (activated) {
          reportPurchase("success");
          setLoading(false);
          return;
        }

        if (!warned) {
          warned = true;
          setLoading(false);
          showAlert(PURCHASE_PENDING_ALERT);
        }
      }
      reportPurchase("failure");
    },
    [reportPurchase, verifyPurchase],
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
      void activateNewPurchase(purchase);
    },
    onPurchaseError: (error) => {
      reportPurchase(purchaseErrorResult(error));
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

  // Pagamento aprovado depois (pendente → aprovado): ao voltar para o app,
  // sincroniza de novo para liberar o plano sem a pessoa precisar fazer nada.
  useEffect(() => {
    if (!token || Platform.OS !== "android") return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void fetchAvailablePurchases({ includeSuspendedAndroid: false })
        .then(syncPaidPurchases)
        .catch(() => {});
    });
    return () => subscription.remove();
  }, [token, syncPaidPurchases]);

  /** A Play oferece o teste de 7 dias para este plano e esta conta Google. */
  const canStartTrial = useCallback(
    (tier: PaidPlan, period: BillingPeriod) =>
      Platform.OS === "android" &&
      hasFreeTrialOffer(
        subscriptions.find((item) => item.id === productIdFor(tier, period)),
      ),
    [subscriptions],
  );

  const subscribe = useCallback(
    async (
      tier: PaidPlan,
      period: BillingPeriod,
      options: { withTrial?: boolean } = {},
    ) => {
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
      const offerToken = subscription
        ? pickOfferToken(subscription, options.withTrial === true)
        : null;

      if (!connected || !subscription || !offerToken) {
        showAlert({
          title: "Plano indisponível",
          message:
            "Não foi possível carregar a assinatura do Google Play. Tente novamente.",
        });
        return;
      }

      setLoading(true);
      pendingPurchase.current = { plan: tier, period };
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
        reportPurchase("failure");
        setLoading(false);
        alertError("Não foi possível iniciar a compra. Tente novamente.");
      }
    },
    [connected, reportPurchase, requestPurchase, subscriptions, token, userId],
  );

  const restore = useCallback(async () => {
    if (!token) {
      alertError("Faça login antes de restaurar.");
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS !== "android") {
        // Stripe vincula a assinatura à conta do Lucro Caseiro. Reconsultar o
        // perfil restaura esse estado após reinstalação, troca de aparelho ou PWA.
        const profile = await fetchProfile(token);
        queryClient.setQueryData([...SUBSCRIPTION_PROFILE_KEY, profile.id], profile);
        await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_LIMITS_KEY });

        // Teste grátis não é assinatura: não há compra para restaurar.
        if (isProfilePremiumActive(profile) && !isProfileOnTrial(profile)) {
          showAlert({
            title: "Restaurado!",
            message: "Sua assinatura foi restaurada.",
          });
        } else {
          showAlert({
            title: "Nenhuma assinatura encontrada",
            message: "Não encontramos uma assinatura ativa vinculada a esta conta.",
          });
        }
        return;
      }

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
      } else {
        showAlert(PURCHASE_PENDING_ALERT);
      }
    } catch (error) {
      alertError(error, "Não foi possível restaurar compras. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [getAvailablePurchases, queryClient, syncPaidPurchases, token]);

  return { subscribe, restore, canStartTrial, loading };
}
