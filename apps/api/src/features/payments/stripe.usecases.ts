import type Stripe from "stripe";

import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import type { CheckoutUrlInput } from "./payments.types";
import {
  deriveStripePremiumStateChange,
  getStripeSubscriptionUserId,
  resolveStripePlanTier,
  selectStripePriceId,
  type StripePrices,
} from "./stripe.domain";

type StripeClient = Pick<Stripe, "checkout" | "subscriptions">;

export interface StripePaymentsConfig {
  prices: StripePrices;
  successUrl: string;
  cancelUrl: string;
}

export class StripeUseCases {
  constructor(
    private stripe: StripeClient | null,
    private subscription: SubscriptionUseCases,
    private cfg: StripePaymentsConfig,
  ) {}

  async createCheckoutUrl({ userId, tier, period }: CheckoutUrlInput): Promise<string> {
    if (!this.stripe) {
      throw new Error("Stripe não configurado");
    }

    const priceId = selectStripePriceId(tier, period, this.cfg.prices);

    if (!priceId) {
      throw new Error("Preço Stripe não configurado");
    }

    const metadata = { userId, tier, period };
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: this.cfg.successUrl,
      cancel_url: this.cfg.cancelUrl,
      allow_promotion_codes: true,
      metadata,
      subscription_data: { metadata },
    });

    if (!session.url) {
      throw new Error("Stripe não retornou URL de checkout");
    }

    return session.url;
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode !== "subscription") return;

      const userId = session.client_reference_id ?? session.metadata?.userId;
      const subscription = await this.getSubscription(session.subscription);
      if (!userId || !subscription) return;

      await this.applySubscriptionState(userId, subscription);
      return;
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const stripeSubscription = event.data.object;
      const userId = getStripeSubscriptionUserId(stripeSubscription);
      if (!userId) return;

      await this.applySubscriptionState(userId, stripeSubscription);
    }
  }

  private async getSubscription(
    subscription: string | Stripe.Subscription | null,
  ): Promise<Stripe.Subscription | null> {
    if (!subscription) return null;
    if (typeof subscription !== "string") return subscription;
    if (!this.stripe) return null;
    return this.stripe.subscriptions.retrieve(subscription);
  }

  private async applySubscriptionState(
    userId: string,
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const change = deriveStripePremiumStateChange(stripeSubscription);

    if (change.action === "activate") {
      // Sem tier inferível (ex.: assinatura Premium legada) → Profissional.
      const tier =
        resolveStripePlanTier(stripeSubscription, this.cfg.prices) ?? "professional";
      await this.subscription.activatePlan(userId, tier, change.expiresAt);
    } else if (change.action === "deactivate") {
      await this.subscription.deactivatePlan(userId);
    }
  }
}
