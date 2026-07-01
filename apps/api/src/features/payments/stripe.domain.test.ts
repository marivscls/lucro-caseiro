import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import {
  deriveStripePremiumStateChange,
  getStripeSubscriptionUserId,
  resolveStripePlanTier,
  selectStripePriceId,
  type StripePrices,
} from "./stripe.domain";

const PRICES: StripePrices = {
  essential: { monthly: "price_ess_monthly", annual: "price_ess_annual" },
  professional: { monthly: "price_pro_monthly", annual: "price_pro_annual" },
};

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
    it("returns the annual price for a tier", () => {
      expect(selectStripePriceId("essential", "annual", PRICES)).toBe("price_ess_annual");
      expect(selectStripePriceId("professional", "annual", PRICES)).toBe(
        "price_pro_annual",
      );
    });

    it("returns the monthly price for a tier", () => {
      expect(selectStripePriceId("essential", "monthly", PRICES)).toBe(
        "price_ess_monthly",
      );
      expect(selectStripePriceId("professional", "monthly", PRICES)).toBe(
        "price_pro_monthly",
      );
    });
  });

  describe("resolveStripePlanTier", () => {
    it("reads the tier from subscription metadata", () => {
      expect(
        resolveStripePlanTier(
          makeSubscription({ metadata: { userId: "user-1", tier: "essential" } }),
          PRICES,
        ),
      ).toBe("essential");
      expect(
        resolveStripePlanTier(
          makeSubscription({ metadata: { userId: "user-1", tier: "professional" } }),
          PRICES,
        ),
      ).toBe("professional");
    });

    it("falls back to matching the price id when metadata is missing", () => {
      const subscription = makeSubscription({
        metadata: { userId: "user-1" },
        items: { data: [{ price: { id: "price_pro_annual" } }] },
      } as unknown as Partial<Stripe.Subscription>);
      expect(resolveStripePlanTier(subscription, PRICES)).toBe("professional");
    });

    it("returns null when neither metadata nor price id resolve a tier", () => {
      const subscription = makeSubscription({
        metadata: { userId: "user-1" },
        items: { data: [{ price: { id: "price_unknown" } }] },
      } as unknown as Partial<Stripe.Subscription>);
      expect(resolveStripePlanTier(subscription, PRICES)).toBeNull();
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
