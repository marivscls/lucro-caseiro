import type Stripe from "stripe";

import type { PaymentPlan } from "./payments.types";

export interface PremiumStateChange {
  action: "activate" | "deactivate" | "ignore";
  expiresAt: Date | null;
}

export function selectStripePriceId(
  plan: PaymentPlan,
  monthlyId: string,
  annualId: string,
): string {
  return plan === "annual" ? annualId : monthlyId;
}

export function getStripeSubscriptionUserId(
  subscription: Stripe.Subscription,
): string | null {
  return subscription.metadata.userId || null;
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
