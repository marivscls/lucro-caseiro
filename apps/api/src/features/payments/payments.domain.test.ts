import { describe, expect, it } from "vitest";

import {
  buildCheckoutUrl,
  derivePremiumStateChange,
  isSubscriptionEvent,
  selectPlanId,
} from "./payments.domain";
import type { MercadoPagoPreapproval } from "./payments.types";

function makePreapproval(
  overrides: Partial<MercadoPagoPreapproval> = {},
): MercadoPagoPreapproval {
  return {
    id: "mp-1",
    status: "authorized",
    external_reference: "user-1",
    next_payment_date: null,
    end_date: null,
    ...overrides,
  };
}

describe("payments.domain", () => {
  describe("buildCheckoutUrl", () => {
    it("includes preapproval_plan_id and external_reference", () => {
      const url = buildCheckoutUrl({
        preapprovalPlanId: "plan-abc",
        externalReference: "user-42",
      });

      expect(url).toContain("preapproval_plan_id=plan-abc");
      expect(url).toContain("external_reference=user-42");
      expect(url.startsWith("https://www.mercadopago.com.br/")).toBe(true);
    });

    it("URL-encodes special characters in references", () => {
      const url = buildCheckoutUrl({
        preapprovalPlanId: "plan",
        externalReference: "user@email.com",
      });
      expect(url).toContain("external_reference=user%40email.com");
    });
  });

  describe("selectPlanId", () => {
    it("returns annual id when plan is annual", () => {
      expect(selectPlanId("annual", "month-1", "year-1")).toBe("year-1");
    });

    it("returns monthly id when plan is monthly", () => {
      expect(selectPlanId("monthly", "month-1", "year-1")).toBe("month-1");
    });
  });

  describe("derivePremiumStateChange", () => {
    it("activates with end_date as expiration when provided", () => {
      const change = derivePremiumStateChange(
        makePreapproval({
          status: "authorized",
          end_date: "2027-01-01T00:00:00.000Z",
          next_payment_date: "2026-06-01T00:00:00.000Z",
        }),
      );
      expect(change.action).toBe("activate");
      expect(change.expiresAt?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    });

    it("falls back to next_payment_date when end_date is null", () => {
      const change = derivePremiumStateChange(
        makePreapproval({
          status: "authorized",
          end_date: null,
          next_payment_date: "2026-06-01T00:00:00.000Z",
        }),
      );
      expect(change.expiresAt?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    });

    it("activates with null expiration when both dates are null", () => {
      const change = derivePremiumStateChange(makePreapproval({ status: "authorized" }));
      expect(change.action).toBe("activate");
      expect(change.expiresAt).toBeNull();
    });

    it("deactivates when status is cancelled", () => {
      const change = derivePremiumStateChange(makePreapproval({ status: "cancelled" }));
      expect(change.action).toBe("deactivate");
    });

    it("deactivates when status is paused", () => {
      const change = derivePremiumStateChange(makePreapproval({ status: "paused" }));
      expect(change.action).toBe("deactivate");
    });

    it("ignores pending status", () => {
      const change = derivePremiumStateChange(makePreapproval({ status: "pending" }));
      expect(change.action).toBe("ignore");
    });
  });

  describe("isSubscriptionEvent", () => {
    it("recognizes preapproval events", () => {
      expect(isSubscriptionEvent("subscription_preapproval")).toBe(true);
    });

    it("recognizes authorized payment events", () => {
      expect(isSubscriptionEvent("subscription_authorized_payment")).toBe(true);
    });

    it("rejects unrelated events", () => {
      expect(isSubscriptionEvent("payment")).toBe(false);
      expect(isSubscriptionEvent("merchant_order")).toBe(false);
    });
  });
});
