import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import { ConflictError, NotFoundError } from "../../shared/errors";
import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import type { StripePrices } from "./stripe.domain";
import { StripeUseCases } from "./stripe.usecases";

const USER_ID = "user-1";
const ACTIVE_STRIPE = { isTrial: false, provider: "stripe" };

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
  opts: {
    subscription?: Stripe.Subscription;
    prices?: StripePrices;
    trialAvailable?: boolean;
    found?: Stripe.Subscription[];
  } = {},
) {
  const stripeSubscription = opts.subscription ?? makeSubscription();
  const createSession = vi
    .fn()
    .mockResolvedValue({ url: "https://checkout.stripe.com/session" });
  const retrieveSubscription = vi.fn().mockResolvedValue(stripeSubscription);
  const searchSubscriptions = vi
    .fn()
    .mockResolvedValue({ data: opts.found ?? [stripeSubscription] });
  const updateSubscription = vi.fn((id: string, params: { cancel_at_period_end: boolean }) =>
    Promise.resolve({
      ...stripeSubscription,
      id,
      cancel_at_period_end: params.cancel_at_period_end,
    }),
  );

  const stripe = {
    checkout: { sessions: { create: createSession } },
    subscriptions: {
      retrieve: retrieveSubscription,
      search: searchSubscriptions,
      update: updateSubscription,
    },
  } as unknown as Pick<Stripe, "checkout" | "subscriptions">;

  const activatePlan = vi.fn().mockResolvedValue(undefined);
  const deactivatePlan = vi.fn().mockResolvedValue(undefined);
  const notifyPaymentFailed = vi.fn().mockResolvedValue(undefined);
  const getProfile = vi
    .fn()
    .mockResolvedValue({ trialAvailable: opts.trialAvailable ?? true });
  const subscription = {
    activatePlan,
    deactivatePlan,
    notifyPaymentFailed,
    getProfile,
  } as unknown as SubscriptionUseCases;

  const sut = new StripeUseCases(stripe, subscription, {
    prices: opts.prices ?? PRICES,
    successUrl: "https://lucrocaseiro.app/success",
    cancelUrl: "https://lucrocaseiro.app/cancel",
  });

  return {
    sut,
    createSession,
    retrieveSubscription,
    activatePlan,
    deactivatePlan,
    notifyPaymentFailed,
    searchSubscriptions,
    updateSubscription,
  };
}

describe("StripeUseCases.createCheckoutUrl", () => {
  it("sells the Premium (professional) price even when the request asks for essential", async () => {
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
        line_items: [{ price: "price_pro_monthly", quantity: 1 }],
        client_reference_id: USER_ID,
        payment_method_collection: "always",
        metadata: { userId: USER_ID, tier: "professional", period: "monthly", trial: "0" },
        subscription_data: {
          metadata: {
            userId: USER_ID,
            tier: "professional",
            period: "monthly",
            trial: "0",
          },
        },
      }),
    );
  });

  it("starts the 7-day trial with a card when the account still has it", async () => {
    const { sut, createSession } = makeSut();

    await sut.createCheckoutUrl({
      userId: USER_ID,
      tier: "professional",
      period: "annual",
      withTrial: true,
    });

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_collection: "always",
        subscription_data: expect.objectContaining({
          trial_period_days: 7,
          trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
        }),
      }),
    );
  });

  it("refuses a second trial for the same account", async () => {
    const { sut, createSession } = makeSut({ trialAvailable: false });

    await expect(
      sut.createCheckoutUrl({
        userId: USER_ID,
        tier: "professional",
        period: "monthly",
        withTrial: true,
      }),
    ).rejects.toThrow(ConflictError);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("never falls back to the essential price when the professional one is missing", async () => {
    const { sut, createSession } = makeSut({
      prices: {
        essential: { monthly: "price_ess_monthly", annual: "price_ess_annual" },
        professional: { monthly: "", annual: "" },
      },
    });
    await expect(
      sut.createCheckoutUrl({ userId: USER_ID, tier: "essential", period: "monthly" }),
    ).rejects.toThrow("Preço Stripe não configurado");
    expect(createSession).not.toHaveBeenCalled();
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
  it.each(["customer.subscription.created", "customer.subscription.updated"])(
    "does not reactivate a canceled subscription from a delayed %s snapshot",
    async (type) => {
      const { sut, retrieveSubscription, activatePlan, deactivatePlan } = makeSut({
        subscription: makeSubscription({ status: "canceled" }),
      });
      await sut.handleEvent({
        type,
        data: { object: makeSubscription() },
      } as Stripe.Event);
      expect(retrieveSubscription).toHaveBeenCalledWith("sub_123");
      expect(activatePlan).not.toHaveBeenCalled();
      expect(deactivatePlan).toHaveBeenCalledWith(USER_ID);
    },
  );

  it("does not downgrade a recovered subscription from an old unpaid snapshot", async () => {
    const { sut, activatePlan, deactivatePlan } = makeSut();
    await sut.handleEvent({
      type: "customer.subscription.updated",
      data: { object: makeSubscription({ status: "unpaid" }) },
    } as Stripe.Event);
    expect(deactivatePlan).not.toHaveBeenCalled();
    expect(activatePlan).toHaveBeenCalledWith(
      USER_ID,
      "professional",
      expect.any(Date),
      ACTIVE_STRIPE,
    );
  });

  it("keeps the current tier and expiry instead of an old subscription revision", async () => {
    const { sut, activatePlan } = makeSut();
    const previous = makeSubscription({
      metadata: { userId: USER_ID, tier: "essential" },
    });
    previous.items.data[0]!.current_period_end = 1_700_000_000;
    await sut.handleEvent({
      type: "customer.subscription.updated",
      data: { object: previous },
    } as Stripe.Event);
    expect(activatePlan).toHaveBeenCalledWith(
      USER_ID,
      "professional",
      new Date("2027-01-01T00:00:00.000Z"),
      ACTIVE_STRIPE,
    );
  });

  it("does not send a stale payment-failure email after recovery", async () => {
    const { sut, notifyPaymentFailed } = makeSut();
    await sut.handleEvent({
      id: "old-failure",
      type: "customer.subscription.updated",
      data: { object: makeSubscription({ status: "past_due" }) },
    } as Stripe.Event);
    expect(notifyPaymentFailed).not.toHaveBeenCalled();
  });

  it("retrieves current state even for expanded checkout subscriptions", async () => {
    const { sut, activatePlan, deactivatePlan } = makeSut({
      subscription: makeSubscription({ status: "canceled" }),
    });
    await sut.handleEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          client_reference_id: USER_ID,
          subscription: makeSubscription(),
        },
      },
    } as Stripe.Event);
    expect(activatePlan).not.toHaveBeenCalled();
    expect(deactivatePlan).toHaveBeenCalledWith(USER_ID);
  });

  it("fails for retry without applying old state when retrieval fails", async () => {
    const { sut, retrieveSubscription, activatePlan, deactivatePlan } = makeSut();
    retrieveSubscription.mockRejectedValue(new Error("Stripe indisponível"));
    await expect(
      sut.handleEvent({
        type: "customer.subscription.updated",
        data: { object: makeSubscription() },
      } as Stripe.Event),
    ).rejects.toThrow("Stripe indisponível");
    expect(activatePlan).not.toHaveBeenCalled();
    expect(deactivatePlan).not.toHaveBeenCalled();
  });

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
      ACTIVE_STRIPE,
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
      ACTIVE_STRIPE,
    );
  });

  it("falls back to professional when no tier can be resolved (legacy premium)", async () => {
    const { sut, activatePlan } = makeSut({
      subscription: makeSubscription({ metadata: { userId: USER_ID } }),
    });

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
      ACTIVE_STRIPE,
    );
  });

  it("deactivates when Stripe sends a canceled subscription", async () => {
    const { sut, deactivatePlan, retrieveSubscription } = makeSut({
      subscription: makeSubscription({ status: "canceled" }),
    });

    await sut.handleEvent({
      type: "customer.subscription.deleted",
      data: { object: makeSubscription({ status: "canceled" }) },
    } as Stripe.Event);

    expect(deactivatePlan).toHaveBeenCalledWith(USER_ID);
    expect(retrieveSubscription).toHaveBeenCalledWith("sub_123");
  });

  it("notifies a failed renewal when the subscription becomes past due", async () => {
    const { sut, notifyPaymentFailed } = makeSut({
      subscription: makeSubscription({ status: "past_due" }),
    });

    await sut.handleEvent({
      id: "evt_payment_failed",
      type: "customer.subscription.updated",
      data: { object: makeSubscription({ status: "past_due" }) },
    } as Stripe.Event);

    expect(notifyPaymentFailed).toHaveBeenCalledWith(USER_ID, "evt_payment_failed");
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

describe("StripeUseCases trial and cancellation", () => {
  it("records a trialing subscription as a card trial", async () => {
    const { sut, activatePlan } = makeSut({
      subscription: makeSubscription({ status: "trialing" }),
    });

    await sut.handleEvent({
      id: "evt_trial",
      type: "customer.subscription.created",
      data: { object: { id: "sub_123" } },
    } as unknown as Stripe.Event);

    expect(activatePlan).toHaveBeenCalledWith(USER_ID, "professional", expect.any(Date), {
      isTrial: true,
      provider: "stripe",
    });
  });

  it("summarizes the account subscription for the cancel screen", async () => {
    const trialEnd = 1_800_000_000;
    const { sut, searchSubscriptions } = makeSut({
      found: [
        makeSubscription({ id: "sub_old", status: "canceled", created: 1 }),
        makeSubscription({
          id: "sub_trial",
          status: "trialing",
          created: 2,
          trial_end: trialEnd,
          cancel_at_period_end: false,
          items: {
            data: [
              {
                current_period_end: trialEnd,
                price: { unit_amount: 6990, recurring: { interval: "month" } },
              },
            ],
          } as unknown as Stripe.Subscription["items"],
        }),
      ],
    });

    const summary = await sut.getSubscriptionSummary(USER_ID);

    expect(searchSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ query: `metadata['userId']:'${USER_ID}'` }),
    );
    expect(summary).toEqual({
      status: "trialing",
      trialEndsAt: new Date(trialEnd * 1000).toISOString(),
      currentPeriodEnd: new Date(trialEnd * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      amountCents: 6990,
      interval: "month",
    });
  });

  it("cancels at the end of the period so the trial never charges", async () => {
    const { sut, updateSubscription } = makeSut({
      found: [makeSubscription({ id: "sub_trial", status: "trialing", created: 2 })],
    });

    const summary = await sut.cancelSubscription(USER_ID);

    expect(updateSubscription).toHaveBeenCalledWith("sub_trial", {
      cancel_at_period_end: true,
    });
    expect(summary.cancelAtPeriodEnd).toBe(true);
  });

  it("resumes a canceled subscription while it is still valid", async () => {
    const { sut, updateSubscription } = makeSut();

    await sut.resumeSubscription(USER_ID);

    expect(updateSubscription).toHaveBeenCalledWith("sub_123", {
      cancel_at_period_end: false,
    });
  });

  it("says there is nothing to cancel when the account has no card subscription", async () => {
    const { sut } = makeSut({ found: [] });

    await expect(sut.cancelSubscription(USER_ID)).rejects.toThrow(NotFoundError);
  });
});
