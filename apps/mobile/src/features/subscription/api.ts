import type {
  BillingPeriod,
  FreemiumLimits,
  PaidPlan,
  UpdateProfile,
  UserProfile,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";
import type { AcceptedProductId } from "./purchases";

const BASE = "/api/v1/subscription";

export async function fetchProfile(token: string): Promise<UserProfile> {
  return apiClient<UserProfile>(`${BASE}/profile`, { token });
}

export async function updateProfile(
  token: string,
  data: UpdateProfile,
): Promise<UserProfile> {
  return apiClient<UserProfile>(`${BASE}/profile`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export async function fetchLimits(token: string): Promise<FreemiumLimits> {
  return apiClient<FreemiumLimits>(`${BASE}/limits`, { token });
}

export async function syncPlan(
  token: string,
  data: {
    platform: "android";
    productId: AcceptedProductId;
    purchaseToken: string;
  },
): Promise<UserProfile> {
  return apiClient<UserProfile>(`${BASE}/sync-plan`, {
    method: "POST",
    body: data,
    token,
  });
}

export async function createStripeCheckout(
  token: string,
  tier: PaidPlan,
  period: BillingPeriod,
  withTrial = false,
): Promise<{ url: string }> {
  return apiClient<{ url: string }>(`/api/v1/payments/stripe/checkout`, {
    method: "POST",
    body: { tier, period, withTrial },
    token,
  });
}

/** Assinatura no cartão (Stripe) da conta, para a tela de cancelamento. */
export interface StripeSubscriptionSummary {
  status: "trialing" | "active" | "past_due";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  amountCents: number | null;
  interval: "month" | "year" | null;
}

export async function fetchStripeSubscription(
  token: string,
): Promise<StripeSubscriptionSummary | null> {
  const { subscription } = await apiClient<{
    subscription: StripeSubscriptionSummary | null;
  }>(`/api/v1/payments/stripe/subscription`, { token });
  return subscription;
}

export async function cancelStripeSubscription(
  token: string,
): Promise<StripeSubscriptionSummary> {
  const { subscription } = await apiClient<{ subscription: StripeSubscriptionSummary }>(
    `/api/v1/payments/stripe/cancel`,
    { method: "POST", token },
  );
  return subscription;
}

export async function resumeStripeSubscription(
  token: string,
): Promise<StripeSubscriptionSummary> {
  const { subscription } = await apiClient<{ subscription: StripeSubscriptionSummary }>(
    `/api/v1/payments/stripe/resume`,
    { method: "POST", token },
  );
  return subscription;
}
