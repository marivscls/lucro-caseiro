import { describe, expect, it } from "vitest";

import type { StripeSubscriptionSummary } from "./api";
import { cancelProvider, googlePlayCopy, stripeStatusCopy } from "./cancel-plan";

function summary(
  overrides: Partial<StripeSubscriptionSummary> = {},
): StripeSubscriptionSummary {
  return {
    status: "trialing",
    trialEndsAt: "2026-11-27T15:00:00.000Z",
    currentPeriodEnd: "2026-11-27T15:00:00.000Z",
    cancelAtPeriodEnd: false,
    amountCents: 6990,
    interval: "month",
    ...overrides,
  };
}

describe("cancel plan copy", () => {
  it("uses the saved store and falls back to the platform store", () => {
    expect(cancelProvider({ planProvider: "stripe" }, "android")).toBe("stripe");
    expect(cancelProvider({ planProvider: null }, "android")).toBe("google_play");
    expect(cancelProvider(null, "web")).toBe("stripe");
  });

  it("says when the trial charges and that canceling before costs nothing", () => {
    const copy = stripeStatusCopy(summary());
    expect(copy.title).toBe("Seu teste vai até 27 de novembro de 2026");
    expect(copy.message).toContain("cobramos R$ 69,90 por mês");
    expect(copy.message).toContain("você não paga nada");
  });

  it("confirms a canceled trial will not be charged", () => {
    const copy = stripeStatusCopy(summary({ cancelAtPeriodEnd: true }));
    expect(copy.title).toBe("Teste cancelado");
    expect(copy.message).toContain("Você não vai pagar nada");
  });

  it("explains the next charge of an active subscription", () => {
    const copy = stripeStatusCopy(
      summary({
        status: "active",
        trialEndsAt: null,
        amountCents: 62900,
        interval: "year",
      }),
    );
    expect(copy.message).toContain("R$ 629,00 por ano em 27 de novembro de 2026");
  });

  it("tells Google Play trial users to cancel in the store before the date", () => {
    const copy = googlePlayCopy({
      plan: "professional",
      planExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      planIsTrial: true,
    });
    expect(copy.title).toMatch(/^Seu teste vai até /);
    expect(copy.message).toContain("Cancelar assinatura");
  });
});
