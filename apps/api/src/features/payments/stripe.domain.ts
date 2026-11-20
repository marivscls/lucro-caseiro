import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import type Stripe from "stripe";

import type { StripeSubscriptionSummary } from "./payments.types";

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

const MANAGED_STATUSES = ["trialing", "active", "past_due"] as const;
type ManagedStatus = (typeof MANAGED_STATUSES)[number];

function isManagedStatus(status: string): status is ManagedStatus {
  return (MANAGED_STATUSES as readonly string[]).includes(status);
}

/** Entre as assinaturas da conta, a que ainda vale (a mais recente). */
export function pickManagedSubscription(
  subscriptions: Stripe.Subscription[],
): Stripe.Subscription | null {
  const managed = subscriptions
    .filter((subscription) => isManagedStatus(subscription.status))
    .sort((a, b) => b.created - a.created);
  return managed[0] ?? null;
}

function toIso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export function summarizeStripeSubscription(
  subscription: Stripe.Subscription,
): StripeSubscriptionSummary {
  const item = subscription.items.data[0];
  const status = isManagedStatus(subscription.status) ? subscription.status : "active";
  const interval = item?.price?.recurring?.interval;
  return {
    status,
    trialEndsAt: subscription.status === "trialing" ? toIso(subscription.trial_end) : null,
    currentPeriodEnd: toIso(item?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || Boolean(subscription.cancel_at),
    amountCents: item?.price?.unit_amount ?? null,
    interval: interval === "month" || interval === "year" ? interval : null,
  };
}
