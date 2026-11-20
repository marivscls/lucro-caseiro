import { getActiveBrand } from "@lucro-caseiro/brands";
import { Platform } from "react-native";

const SUPPORT_EMAIL = "contato@orionseven.com.br";

export interface SubscriptionManagementTarget {
  readonly actionLabel: string;
  readonly providerLabel: string;
  readonly url: string;
}

export function subscriptionManagementTarget(
  platform: string = Platform.OS,
): SubscriptionManagementTarget {
  if (platform === "android") {
    return {
      actionLabel: "Abrir Google Play",
      providerLabel: "Google Play",
      url: `https://play.google.com/store/account/subscriptions?package=${getActiveBrand().androidPackage}`,
    };
  }

  const subject = encodeURIComponent("Cancelar assinatura do Lucro Caseiro");
  const body = encodeURIComponent(
    "Olá! Quero cancelar minha assinatura e impedir novas cobranças.",
  );
  return {
    actionLabel: "Pedir cancelamento",
    providerLabel: "suporte do Lucro Caseiro",
    url: `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
  };
}
