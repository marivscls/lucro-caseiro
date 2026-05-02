import type {
  FreemiumLimits,
  UpdateProfile,
  UserProfile,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

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
  data: { plan: "free" | "premium"; expiresAt: string | null },
): Promise<UserProfile> {
  return apiClient<UserProfile>(`${BASE}/sync-plan`, {
    method: "POST",
    body: data,
    token,
  });
}

export async function createMercadoPagoCheckout(
  token: string,
  plan: "monthly" | "annual",
): Promise<{ url: string }> {
  return apiClient<{ url: string }>(`/api/v1/payments/mercadopago/checkout`, {
    method: "POST",
    body: { plan },
    token,
  });
}
