import type Stripe from "stripe";

import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import type { CheckoutUrlInput } from "./payments.types";
import {
  deriveStripePremiumStateChange,
  getStripeSubscriptionUserId,
  selectStripePriceId,
} from "./stripe.domain";

type StripeClient = Pick<Stripe, "checkout" | "subscriptions">;

export interface StripePaymentsConfig {
  monthlyPriceId: string;
  annualPriceId: string;
  successUrl: string;
  cancelUrl: string;
}

export class StripeUseCases {
  constructor(
    private stripe: StripeClient | null,
    private subscription: SubscriptionUseCases,
    private cfg: StripePaymentsConfig,
  ) {}

  async createCheckoutUrl({ userId, plan }: CheckoutUrlInput): Promise<string> {
    if (!this.stripe) {
      throw new Error("Stripe nao configurado");
    }

    const priceId = selectStripePriceId(
      plan,
      this.cfg.monthlyPriceId,
      this.cfg.annualPriceId,
    );

    if (!priceId) {
      throw new Error("Preco Stripe nao configurado");
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: this.cfg.successUrl,
      cancel_url: this.cfg.cancelUrl,
      allow_promotion_codes: true,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
    });

    if (!session.url) {
      throw new Error("Stripe nao retornou URL de checkout");
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
      await this.subscription.activatePremium(userId, change.expiresAt);
    } else if (change.action === "deactivate") {
      await this.subscription.deactivatePremium(userId);
    }
  }
}
