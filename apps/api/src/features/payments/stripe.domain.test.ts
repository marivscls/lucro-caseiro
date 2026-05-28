import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import {
  deriveStripePremiumStateChange,
  getStripeSubscriptionUserId,
  selectStripePriceId,
} from "./stripe.domain";

function makeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    status: "active",
    metadata: { userId: "user-1" },
    items: {
      data: [{ current_period_end: 1_798_761_600 }],
    },
    ...overrides,
  } as Stripe.Subscription;
}

describe("stripe.domain", () => {
  describe("selectStripePriceId", () => {
    it("returns annual price when plan is annual", () => {
      expect(selectStripePriceId("annual", "price_monthly", "price_annual")).toBe(
        "price_annual",
      );
    });

    it("returns monthly price when plan is monthly", () => {
      expect(selectStripePriceId("monthly", "price_monthly", "price_annual")).toBe(
        "price_monthly",
      );
    });
  });

  describe("getStripeSubscriptionUserId", () => {
    it("reads the user id from subscription metadata", () => {
      expect(getStripeSubscriptionUserId(makeSubscription())).toBe("user-1");
    });

    it("returns null when metadata is missing", () => {
      expect(getStripeSubscriptionUserId(makeSubscription({ metadata: {} }))).toBeNull();
    });
  });

  describe("deriveStripePremiumStateChange", () => {
    it("activates active subscriptions until the current period end", () => {
      const change = deriveStripePremiumStateChange(makeSubscription());
      expect(change.action).toBe("activate");
      expect(change.expiresAt?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    });

    it("activates trialing subscriptions", () => {
      const change = deriveStripePremiumStateChange(
        makeSubscription({ status: "trialing" }),
      );
      expect(change.action).toBe("activate");
    });

    it("deactivates canceled subscriptions", () => {
      const change = deriveStripePremiumStateChange(
        makeSubscription({ status: "canceled" }),
      );
      expect(change.action).toBe("deactivate");
    });

    it("ignores past_due subscriptions while Stripe is retrying payment", () => {
      const change = deriveStripePremiumStateChange(
        makeSubscription({ status: "past_due" }),
      );
      expect(change.action).toBe("ignore");
    });
  });
});
