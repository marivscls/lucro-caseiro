import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";

import { useAuth } from "../../shared/hooks/use-auth";
import { syncPlan } from "./api";

interface RevenueCatConfig {
  iosKey?: string;
  androidKey?: string;
  entitlementId?: string;
}

const revenuecatConfig =
  (Constants.expoConfig?.extra?.revenuecat as RevenueCatConfig | undefined) ?? {};

interface PurchasesModule {
  default: {
    configure: (config: { apiKey: string }) => void;
    logIn: (userId: string) => Promise<{ customerInfo: CustomerInfo }>;
    getCustomerInfo: () => Promise<CustomerInfo>;
    getOfferings: () => Promise<Offerings>;
    purchasePackage: (pkg: Package) => Promise<{ customerInfo: CustomerInfo }>;
    restorePurchases: () => Promise<CustomerInfo>;
  };
}

interface CustomerInfo {
  entitlements: {
    active: Record<string, { expirationDate: string | null }>;
  };
}

interface Offerings {
  current: {
    monthly: Package | null;
    annual: Package | null;
  } | null;
}

interface Package {
  identifier: string;
  product: {
    priceString: string;
  };
}

const REVENUECAT_API_KEY = Platform.select({
  ios: revenuecatConfig.iosKey ?? "",
  android: revenuecatConfig.androidKey ?? "",
  default: "",
});

const ENTITLEMENT_ID = revenuecatConfig.entitlementId ?? "premium";

let purchasesModule: PurchasesModule["default"] | null = null;
let initialized = false;

function getPurchases(): PurchasesModule["default"] | null {
  if (!purchasesModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("react-native-purchases") as PurchasesModule;
      purchasesModule = mod.default;
    } catch {
      return null;
    }
  }
  return purchasesModule;
}

function isSubscribed(info: CustomerInfo): boolean {
  return ENTITLEMENT_ID in info.entitlements.active;
}

function getExpirationDate(info: CustomerInfo): string | null {
  return info.entitlements.active[ENTITLEMENT_ID]?.expirationDate ?? null;
}

export function useSubscription() {
  const { token, userId } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const purchases = getPurchases();
    if (!purchases || initialized || !REVENUECAT_API_KEY || !userId) return;

    purchases.configure({ apiKey: REVENUECAT_API_KEY });
    purchases.logIn(userId).catch(() => {
      // Non-blocking: if login fails, continue without RevenueCat
    });
    initialized = true;
  }, [userId]);

  // Verify subscription on mount (silent sync)
  useEffect(() => {
    if (!token || !userId) return;

    const purchases = getPurchases();
    if (!purchases) return;

    purchases
      .getCustomerInfo()
      .then(async (info) => {
        const subscribed = isSubscribed(info);
        await syncPlan(token, {
          plan: subscribed ? "premium" : "free",
          expiresAt: getExpirationDate(info),
        });
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      })
      .catch(() => {
        // Silent — don't block app startup
      });
  }, [token, userId, queryClient]);

  const subscribe = useCallback(
    async (period: "monthly" | "annual") => {
      const purchases = getPurchases();
      if (!purchases || !token) {
        Alert.alert("Em breve", "Assinatura sera disponibilizada em breve.");
        return;
      }

      setLoading(true);
      try {
        const offerings = await purchases.getOfferings();
        const pkg =
          period === "monthly" ? offerings.current?.monthly : offerings.current?.annual;

        if (!pkg) {
          Alert.alert("Erro", "Plano nao disponivel no momento.");
          return;
        }

        const { customerInfo } = await purchases.purchasePackage(pkg);

        if (isSubscribed(customerInfo)) {
          await syncPlan(token, {
            plan: "premium",
            expiresAt: getExpirationDate(customerInfo),
          });
          await queryClient.invalidateQueries({ queryKey: ["subscription"] });
          Alert.alert("Parabens!", "Voce agora e Premium! Aproveite todos os recursos.");
        }
      } catch {
        // User cancelled or purchase failed — don't show error for cancellation
      } finally {
        setLoading(false);
      }
    },
    [token, queryClient],
  );

  const restore = useCallback(async () => {
    const purchases = getPurchases();
    if (!purchases || !token) {
      Alert.alert("Erro", "Nao foi possivel restaurar. Tente novamente.");
      return;
    }

    setLoading(true);
    try {
      const info = await purchases.restorePurchases();

      if (isSubscribed(info)) {
        await syncPlan(token, {
          plan: "premium",
          expiresAt: getExpirationDate(info),
        });
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
        Alert.alert("Restaurado!", "Sua assinatura Premium foi restaurada.");
      } else {
        Alert.alert(
          "Nenhuma assinatura encontrada",
          "Nao encontramos uma assinatura ativa vinculada a esta conta.",
        );
      }
    } catch {
      Alert.alert("Erro", "Nao foi possivel restaurar compras. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [token, queryClient]);

  return { subscribe, restore, loading };
}
