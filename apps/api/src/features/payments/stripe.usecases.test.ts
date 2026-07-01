import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import type { StripePrices } from "./stripe.domain";
import { StripeUseCases } from "./stripe.usecases";

const USER_ID = "user-1";

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
    metadata: { userId: USER_ID, tier: "professional" },
    items: {
      data: [{ current_period_end: 1_798_761_600 }],
    },
    ...overrides,
  } as Stripe.Subscription;
}

function makeSut(
  opts: { subscription?: Stripe.Subscription; prices?: StripePrices } = {},
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

  const activatePlan = vi.fn().mockResolvedValue(undefined);
  const deactivatePlan = vi.fn().mockResolvedValue(undefined);
  const subscription = {
    activatePlan,
    deactivatePlan,
  } as unknown as SubscriptionUseCases;

  const sut = new StripeUseCases(stripe, subscription, {
    prices: opts.prices ?? PRICES,
    successUrl: "https://lucrocaseiro.app/success",
    cancelUrl: "https://lucrocaseiro.app/cancel",
  });

  return { sut, createSession, retrieveSubscription, activatePlan, deactivatePlan };
}

describe("StripeUseCases.createCheckoutUrl", () => {
  it("creates a subscription checkout session with the selected tier price", async () => {
    const { sut, createSession } = makeSut();

    const url = await sut.createCheckoutUrl({
      userId: USER_ID,
      tier: "essential",
      period: "monthly",
    });

    expect(url).toBe("https://checkout.stripe.com/session");
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_ess_monthly", quantity: 1 }],
        client_reference_id: USER_ID,
        metadata: { userId: USER_ID, tier: "essential", period: "monthly" },
        subscription_data: {
          metadata: { userId: USER_ID, tier: "essential", period: "monthly" },
        },
      }),
    );
  });

  it("selects the professional annual price", async () => {
    const { sut, createSession } = makeSut();

    await sut.createCheckoutUrl({
      userId: USER_ID,
      tier: "professional",
      period: "annual",
    });

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_pro_annual", quantity: 1 }],
      }),
    );
  });

  it("throws when price id is not configured", async () => {
    const { sut } = makeSut({
      prices: {
        essential: { monthly: "", annual: "" },
        professional: { monthly: "", annual: "" },
      },
    });
    await expect(
      sut.createCheckoutUrl({ userId: USER_ID, tier: "essential", period: "monthly" }),
    ).rejects.toThrow("Preço Stripe não configurado");
  });
});

describe("StripeUseCases.handleEvent", () => {
  it("activates the resolved tier after checkout session completion", async () => {
    const { sut, retrieveSubscription, activatePlan } = makeSut();

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
    expect(activatePlan).toHaveBeenCalledWith(
      USER_ID,
      "professional",
      new Date("2027-01-01T00:00:00.000Z"),
    );
  });

  it("activates essential when the subscription metadata carries the essential tier", async () => {
    const { sut, activatePlan } = makeSut({
      subscription: makeSubscription({
        metadata: { userId: USER_ID, tier: "essential" },
      }),
    });

    await sut.handleEvent({
      type: "customer.subscription.updated",
      data: {
        object: makeSubscription({ metadata: { userId: USER_ID, tier: "essential" } }),
      },
    } as Stripe.Event);

    expect(activatePlan).toHaveBeenCalledWith(
      USER_ID,
      "essential",
      new Date("2027-01-01T00:00:00.000Z"),
    );
  });

  it("falls back to professional when no tier can be resolved (legacy premium)", async () => {
    const { sut, activatePlan } = makeSut();

    await sut.handleEvent({
      type: "customer.subscription.updated",
      data: {
        object: makeSubscription({
          metadata: { userId: USER_ID },
          items: { data: [{ current_period_end: 1_798_761_600 }] },
        } as unknown as Partial<Stripe.Subscription>),
      },
    } as Stripe.Event);

    expect(activatePlan).toHaveBeenCalledWith(
      USER_ID,
      "professional",
      new Date("2027-01-01T00:00:00.000Z"),
    );
  });

  it("deactivates when Stripe sends a canceled subscription", async () => {
    const { sut, deactivatePlan } = makeSut();

    await sut.handleEvent({
      type: "customer.subscription.deleted",
      data: { object: makeSubscription({ status: "canceled" }) },
    } as Stripe.Event);

    expect(deactivatePlan).toHaveBeenCalledWith(USER_ID);
  });

  it("ignores unrelated events", async () => {
    const { sut, activatePlan, deactivatePlan } = makeSut();

    await sut.handleEvent({
      type: "payment_intent.succeeded",
      data: { object: {} },
    } as Stripe.Event);

    expect(activatePlan).not.toHaveBeenCalled();
    expect(deactivatePlan).not.toHaveBeenCalled();
  });
});
