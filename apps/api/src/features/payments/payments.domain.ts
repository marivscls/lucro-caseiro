import type { MercadoPagoPreapproval, PaymentPlan } from "./payments.types";

const MP_CHECKOUT_BASE = "https://www.mercadopago.com.br/subscriptions/checkout";

export interface BuildCheckoutUrlOptions {
  preapprovalPlanId: string;
  externalReference: string;
}

export function buildCheckoutUrl({
  preapprovalPlanId,
  externalReference,
}: BuildCheckoutUrlOptions): string {
  const params = new URLSearchParams({
    preapproval_plan_id: preapprovalPlanId,
    external_reference: externalReference,
  });
  return `${MP_CHECKOUT_BASE}?${params.toString()}`;
}

export function selectPlanId(
  plan: PaymentPlan,
  monthlyId: string,
  annualId: string,
): string {
  return plan === "annual" ? annualId : monthlyId;
}

export interface PremiumStateChange {
  action: "activate" | "deactivate" | "ignore";
  expiresAt: Date | null;
}

export function derivePremiumStateChange(
  preapproval: MercadoPagoPreapproval,
): PremiumStateChange {
  if (preapproval.status === "authorized") {
    const expiry = preapproval.end_date ?? preapproval.next_payment_date;
    return {
      action: "activate",
      expiresAt: expiry ? new Date(expiry) : null,
    };
  }

  if (preapproval.status === "cancelled" || preapproval.status === "paused") {
    return { action: "deactivate", expiresAt: null };
  }

  return { action: "ignore", expiresAt: null };
}

export function isSubscriptionEvent(type: string): boolean {
  return (
    type === "subscription_preapproval" || type === "subscription_authorized_payment"
  );
}
