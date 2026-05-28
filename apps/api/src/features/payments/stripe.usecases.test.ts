import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import { StripeUseCases } from "./stripe.usecases";

const USER_ID = "user-1";

function makeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    status: "active",
    metadata: { userId: USER_ID },
    items: {
      data: [{ current_period_end: 1_798_761_600 }],
    },
    ...overrides,
  } as Stripe.Subscription;
}

function makeSut(
  opts: { subscription?: Stripe.Subscription; monthlyPriceId?: string } = {},
) {
  const stripeSubscription = opts.subscription ?? makeSubscription();
  const createSession = vi
    .fn()
    .mockResolvedValue({ url: "https://checkout.stripe.com/session" });
  const retrieveSubscription = vi.fn().mockResolvedValue(stripeSubscription);

  const stripe = {
    checkout: { sessions: { create: createSession } },
    subscriptions: { retrieve: retrieveSubscription },
  } as unknown as Pick<Stripe, "checkout" | "subscriptions">;

  const activatePremium = vi.fn().mockResolvedValue(undefined);
  const deactivatePremium = vi.fn().mockResolvedValue(undefined);
  const subscription = {
    activatePremium,
    deactivatePremium,
  } as unknown as SubscriptionUseCases;

  const sut = new StripeUseCases(stripe, subscription, {
    monthlyPriceId: opts.monthlyPriceId ?? "price_monthly",
    annualPriceId: "price_annual",
    successUrl: "https://lucrocaseiro.app/success",
    cancelUrl: "https://lucrocaseiro.app/cancel",
  });

  return { sut, createSession, retrieveSubscription, activatePremium, deactivatePremium };
}

describe("StripeUseCases.createCheckoutUrl", () => {
  it("creates a subscription checkout session with the selected price", async () => {
    const { sut, createSession } = makeSut();

    const url = await sut.createCheckoutUrl({ userId: USER_ID, plan: "monthly" });

    expect(url).toBe("https://checkout.stripe.com/session");
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_monthly", quantity: 1 }],
        client_reference_id: USER_ID,
        metadata: { userId: USER_ID, plan: "monthly" },
        subscription_data: { metadata: { userId: USER_ID, plan: "monthly" } },
      }),
    );
  });

  it("throws when price id is not configured", async () => {
    const { sut } = makeSut({ monthlyPriceId: "" });
    await expect(
      sut.createCheckoutUrl({ userId: USER_ID, plan: "monthly" }),
    ).rejects.toThrow("Preco Stripe nao configurado");
  });
});

describe("StripeUseCases.handleEvent", () => {
  it("activates premium after checkout session completion", async () => {
    const { sut, retrieveSubscription, activatePremium } = makeSut();

    await sut.handleEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          client_reference_id: USER_ID,
          subscription: "sub_123",
          metadata: {},
        },
      },
    } as Stripe.Event);

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_123");
    expect(activatePremium).toHaveBeenCalledWith(
      USER_ID,
      new Date("2027-01-01T00:00:00.000Z"),
    );
  });

  it("deactivates premium when Stripe sends a canceled subscription", async () => {
    const { sut, deactivatePremium } = makeSut();

    await sut.handleEvent({
      type: "customer.subscription.deleted",
      data: { object: makeSubscription({ status: "canceled" }) },
    } as Stripe.Event);

    expect(deactivatePremium).toHaveBeenCalledWith(USER_ID);
  });

  it("ignores unrelated events", async () => {
    const { sut, activatePremium, deactivatePremium } = makeSut();

    await sut.handleEvent({
      type: "payment_intent.succeeded",
      data: { object: {} },
    } as Stripe.Event);

    expect(activatePremium).not.toHaveBeenCalled();
    expect(deactivatePremium).not.toHaveBeenCalled();
  });
});
