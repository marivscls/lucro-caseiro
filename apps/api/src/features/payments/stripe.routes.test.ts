import { describe, expect, it, vi } from "vitest";

import { buildStripeEvent } from "./stripe.webhook";

const body = Buffer.from('{"id":"evt_1","type":"customer.subscription.updated"}');

describe("buildStripeEvent", () => {
  it("fails closed when the webhook secret is missing", () => {
    expect(() =>
      buildStripeEvent(
        body,
        { "stripe-signature": "signature" },
        {
          stripe: { webhooks: { constructEvent: vi.fn() } } as never,
          webhookSecret: "",
        },
      ),
    ).toThrow("STRIPE_WEBHOOK_SECRET nao configurado");
  });

  it("rejects requests without a Stripe signature", () => {
    expect(() =>
      buildStripeEvent(
        body,
        {},
        {
          stripe: { webhooks: { constructEvent: vi.fn() } } as never,
          webhookSecret: "whsec_test",
        },
      ),
    ).toThrow("Assinatura Stripe invalida");
  });

  it("delegates verification to Stripe with raw body, signature and secret", () => {
    const event = { id: "evt_1", type: "customer.subscription.updated" };
    const constructEvent = vi.fn(() => event);

    expect(
      buildStripeEvent(
        body,
        { "stripe-signature": "signature" },
        {
          stripe: { webhooks: { constructEvent } } as never,
          webhookSecret: "whsec_test",
        },
      ),
    ).toBe(event);
    expect(constructEvent).toHaveBeenCalledWith(body, "signature", "whsec_test");
  });
});
