import type Stripe from "stripe";

import { PREMIUM_TRIAL_DAYS, SOLD_PLAN } from "@lucro-caseiro/contracts";

import { ConflictError, NotFoundError } from "../../shared/errors";

import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import type { CheckoutUrlInput, StripeSubscriptionSummary } from "./payments.types";
import {
  deriveStripePremiumStateChange,
  getStripeSubscriptionUserId,
  pickManagedSubscription,
  resolveStripePlanTier,
  selectStripePriceId,
  summarizeStripeSubscription,
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

  /**
   * Um plano pago só (2026-11-15): o body ainda aceita `tier` (essential ou
   * professional) por compatibilidade, mas o checkout sempre vende o `SOLD_PLAN`
   * (Premium). O preço essential antigo do Stripe nunca é vendido de novo.
   */
  async createCheckoutUrl({
    userId,
    period,
    withTrial = false,
  }: CheckoutUrlInput): Promise<string> {
    if (!this.stripe) {
      throw new Error("Stripe não configurado");
    }

    // Um teste por e-mail: o backend decide, nunca o app.
    if (withTrial) {
      const profile = await this.subscription.getProfile(userId);
      if (!profile.trialAvailable) {
        throw new ConflictError(
          "Esta conta já usou o teste grátis. Você pode assinar o Premium direto.",
        );
      }
    }

    const tier = SOLD_PLAN;
    const priceId = selectStripePriceId(tier, period, this.cfg.prices);

    if (!priceId) {
      throw new Error("Preço Stripe não configurado");
    }

    const metadata = { userId, tier, period, trial: withTrial ? "1" : "0" };
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: this.cfg.successUrl,
      cancel_url: this.cfg.cancelUrl,
      allow_promotion_codes: true,
      // Teste só com cartão: o Checkout pede o cartão mesmo sem cobrar agora.
      payment_method_collection: "always",
      metadata,
      subscription_data: withTrial
        ? {
            metadata,
            trial_period_days: PREMIUM_TRIAL_DAYS,
            trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
          }
        : { metadata },
    });

    if (!session.url) {
      throw new Error("Stripe não retornou URL de checkout");
    }

    return session.url;
  }

  /** Assinatura Stripe que ainda cobra/está valendo para a conta, ou `null`. */
  async getSubscriptionSummary(userId: string): Promise<StripeSubscriptionSummary | null> {
    const subscription = await this.findManagedSubscription(userId);
    return subscription ? summarizeStripeSubscription(subscription) : null;
  }

  /**
   * Cancela sem cobrar de novo: a assinatura (ou o teste) vale até o fim do
   * período atual e não renova. No teste, nada é cobrado.
   */
  async cancelSubscription(userId: string): Promise<StripeSubscriptionSummary> {
    return this.setCancelAtPeriodEnd(userId, true);
  }

  /** Desfaz o cancelamento enquanto o período ainda vale. */
  async resumeSubscription(userId: string): Promise<StripeSubscriptionSummary> {
    return this.setCancelAtPeriodEnd(userId, false);
  }

  private async setCancelAtPeriodEnd(
    userId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<StripeSubscriptionSummary> {
    if (!this.stripe) throw new Error("Stripe não configurado");
    const subscription = await this.findManagedSubscription(userId);
    if (!subscription) {
      throw new NotFoundError("Nenhuma assinatura no cartão encontrada nesta conta.");
    }
    const updated = await this.stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });
    return summarizeStripeSubscription(updated);
  }

  private async findManagedSubscription(
    userId: string,
  ): Promise<Stripe.Subscription | null> {
    if (!this.stripe) throw new Error("Stripe não configurado");
    // userId vem do JWT (uuid); a assinatura guarda o mesmo id na metadata.
    const result = await this.stripe.subscriptions.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 20,
    });
    return pickManagedSubscription(result.data);
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
      const stripeSubscription = await this.getSubscription(event.data.object.id);
      if (!stripeSubscription) return;
      const userId = getStripeSubscriptionUserId(stripeSubscription);
      if (!userId) return;

      if (
        event.type === "customer.subscription.updated" &&
        stripeSubscription.status === "past_due"
      ) {
        await this.subscription.notifyPaymentFailed(userId, event.id);
      }

      await this.applySubscriptionState(userId, stripeSubscription);
    }
  }

  private async getSubscription(
    subscription: string | Stripe.Subscription | null,
  ): Promise<Stripe.Subscription | null> {
    if (!subscription) return null;
    if (!this.stripe) throw new Error("Stripe não configurado");
    const id = typeof subscription === "string" ? subscription : subscription.id;
    return this.stripe.subscriptions.retrieve(id);
  }

  private async applySubscriptionState(
    userId: string,
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const change = deriveStripePremiumStateChange(stripeSubscription);

    if (change.action === "activate") {
      // Sem tier inferível (ex.: assinatura legada) → professional (o Premium vendido).
      const tier =
        resolveStripePlanTier(stripeSubscription, this.cfg.prices) ?? "professional";
      await this.subscription.activatePlan(userId, tier, change.expiresAt, {
        isTrial: stripeSubscription.status === "trialing",
        provider: "stripe",
      });
    } else if (change.action === "deactivate") {
      await this.subscription.deactivatePlan(userId);
    }
  }
}
