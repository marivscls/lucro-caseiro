import { describe, expect, it, vi } from "vitest";

import type { SubscriptionUseCases } from "../subscription/subscription.usecases";
import { MercadoPagoUseCases } from "./mercadopago.usecases";
import type { IMercadoPagoClient, MercadoPagoPreapproval } from "./payments.types";

const USER_ID = "user-1";

function makePreapproval(
  overrides: Partial<MercadoPagoPreapproval> = {},
): MercadoPagoPreapproval {
  return {
    id: "mp-pre-1",
    status: "authorized",
    external_reference: USER_ID,
    next_payment_date: null,
    end_date: null,
    ...overrides,
  };
}

function makeSut(
  opts: {
    preapproval?: MercadoPagoPreapproval;
    monthlyPlanId?: string;
    annualPlanId?: string;
  } = {},
) {
  const getPreapproval = vi.fn().mockResolvedValue(opts.preapproval ?? makePreapproval());

  const client: IMercadoPagoClient = { getPreapproval };

  const activatePremium = vi.fn().mockResolvedValue(undefined);
  const deactivatePremium = vi.fn().mockResolvedValue(undefined);
  const subscription = {
    activatePremium,
    deactivatePremium,
  } as unknown as SubscriptionUseCases;

  const sut = new MercadoPagoUseCases(client, subscription, {
    monthlyPlanId: opts.monthlyPlanId ?? "plan-monthly",
    annualPlanId: opts.annualPlanId ?? "plan-annual",
  });

  return { sut, getPreapproval, activatePremium, deactivatePremium };
}

describe("MercadoPagoUseCases.createCheckoutUrl", () => {
  it("uses monthly plan id for monthly checkout", () => {
    const { sut } = makeSut();
    const url = sut.createCheckoutUrl({ userId: USER_ID, plan: "monthly" });
    expect(url).toContain("preapproval_plan_id=plan-monthly");
    expect(url).toContain(`external_reference=${USER_ID}`);
  });

  it("uses annual plan id for annual checkout", () => {
    const { sut } = makeSut();
    const url = sut.createCheckoutUrl({ userId: USER_ID, plan: "annual" });
    expect(url).toContain("preapproval_plan_id=plan-annual");
  });

  it("throws when plan id is not configured", () => {
    const { sut } = makeSut({ monthlyPlanId: "" });
    expect(() => sut.createCheckoutUrl({ userId: USER_ID, plan: "monthly" })).toThrow(
      "Plano Mercado Pago nao configurado",
    );
  });
});

describe("MercadoPagoUseCases.handleNotification", () => {
  it("activates premium on authorized status", async () => {
    const { sut, activatePremium } = makeSut({
      preapproval: makePreapproval({
        status: "authorized",
        end_date: "2027-01-01T00:00:00.000Z",
      }),
    });

    await sut.handleNotification({
      type: "subscription_preapproval",
      data: { id: "mp-pre-1" },
    });

    expect(activatePremium).toHaveBeenCalledWith(
      USER_ID,
      new Date("2027-01-01T00:00:00.000Z"),
    );
  });

  it("deactivates premium on cancelled status", async () => {
    const { sut, deactivatePremium } = makeSut({
      preapproval: makePreapproval({ status: "cancelled" }),
    });

    await sut.handleNotification({
      type: "subscription_preapproval",
      data: { id: "mp-pre-1" },
    });

    expect(deactivatePremium).toHaveBeenCalledWith(USER_ID);
  });

  it("ignores non-subscription events", async () => {
    const { sut, getPreapproval, activatePremium, deactivatePremium } = makeSut();

    await sut.handleNotification({
      type: "payment",
      data: { id: "any" },
    });

    expect(getPreapproval).not.toHaveBeenCalled();
    expect(activatePremium).not.toHaveBeenCalled();
    expect(deactivatePremium).not.toHaveBeenCalled();
  });

  it("ignores preapproval without external_reference", async () => {
    const { sut, activatePremium, deactivatePremium } = makeSut({
      preapproval: makePreapproval({ external_reference: "" }),
    });

    await sut.handleNotification({
      type: "subscription_preapproval",
      data: { id: "mp-pre-1" },
    });

    expect(activatePremium).not.toHaveBeenCalled();
    expect(deactivatePremium).not.toHaveBeenCalled();
  });

  it("ignores pending status (no state change yet)", async () => {
    const { sut, activatePremium, deactivatePremium } = makeSut({
      preapproval: makePreapproval({ status: "pending" }),
    });

    await sut.handleNotification({
      type: "subscription_authorized_payment",
      data: { id: "mp-pre-1" },
    });

    expect(activatePremium).not.toHaveBeenCalled();
    expect(deactivatePremium).not.toHaveBeenCalled();
  });
});
