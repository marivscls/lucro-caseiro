import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import type Stripe from "stripe";

export type StripePrices = Record<PaidPlan, Record<BillingPeriod, string>>;

export interface PremiumStateChange {
  action: "activate" | "deactivate" | "ignore";
  expiresAt: Date | null;
}

export function selectStripePriceId(
  tier: PaidPlan,
  period: BillingPeriod,
  prices: StripePrices,
): string {
  return prices[tier][period];
}

export function getStripeSubscriptionUserId(
  subscription: Stripe.Subscription,
): string | null {
  return subscription.metadata.userId || null;
}

/**
 * Descobre a que plano pago a assinatura corresponde: primeiro pela metadata
 * `tier` (gravada no checkout), depois casando o price id com a config. Retorna
 * null quando não dá para inferir (o caller decide o fallback).
 */
export function resolveStripePlanTier(
  subscription: Stripe.Subscription,
  prices: StripePrices,
): PaidPlan | null {
  const meta = subscription.metadata.tier;
  if (meta === "essential" || meta === "professional") return meta;

  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId) {
    for (const tier of ["essential", "professional"] as PaidPlan[]) {
      for (const period of ["monthly", "annual"] as BillingPeriod[]) {
        if (prices[tier][period] && prices[tier][period] === priceId) return tier;
      }
    }
  }
  return null;
}

export function deriveStripePremiumStateChange(
  subscription: Stripe.Subscription,
): PremiumStateChange {
  if (subscription.status === "active" || subscription.status === "trialing") {
    const expiresAt = subscription.items.data[0]?.current_period_end;
    return {
      action: "activate",
      expiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
    };
  }

  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired" ||
    subscription.status === "paused" ||
    subscription.status === "unpaid"
  ) {
    return { action: "deactivate", expiresAt: null };
  }

  return { action: "ignore", expiresAt: null };
}
