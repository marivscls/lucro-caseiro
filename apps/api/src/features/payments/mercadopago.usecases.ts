import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import {
  buildCheckoutUrl,
  derivePremiumStateChange,
  isSubscriptionEvent,
  selectPlanId,
} from "./payments.domain";
import type {
  CheckoutUrlInput,
  IMercadoPagoClient,
  MercadoPagoNotification,
} from "./payments.types";

export interface MercadoPagoConfig {
  monthlyPlanId: string;
  annualPlanId: string;
}

export class MercadoPagoUseCases {
  constructor(
    private client: IMercadoPagoClient,
    private subscription: SubscriptionUseCases,
    private cfg: MercadoPagoConfig,
  ) {}

  createCheckoutUrl({ userId, plan }: CheckoutUrlInput): string {
    const preapprovalPlanId = selectPlanId(
      plan,
      this.cfg.monthlyPlanId,
      this.cfg.annualPlanId,
    );

    if (!preapprovalPlanId) {
      throw new Error("Plano Mercado Pago nao configurado");
    }

    return buildCheckoutUrl({
      preapprovalPlanId,
      externalReference: userId,
    });
  }

  async handleNotification(notification: MercadoPagoNotification): Promise<void> {
    if (!isSubscriptionEvent(notification.type)) return;

    const preapproval = await this.client.getPreapproval(notification.data.id);
    const userId = preapproval.external_reference;
    if (!userId) return;

    const change = derivePremiumStateChange(preapproval);

    if (change.action === "activate") {
      await this.subscription.activatePremium(userId, change.expiresAt);
    } else if (change.action === "deactivate") {
      await this.subscription.deactivatePremium(userId);
    }
  }
}
