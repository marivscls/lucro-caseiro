import type { CreatePricing, Pricing } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/pricing";

export async function calculatePricing(
  token: string,
  data: CreatePricing,
): Promise<Pricing> {
  return apiClient<Pricing>(`${BASE}/calculate`, {
    method: "POST",
    body: data,
    token,
  });
}

export async function fetchPricingHistory(
  token: string,
  productId: string,
): Promise<Pricing[]> {
  return apiClient<Pricing[]>(`${BASE}/product/${productId}/history`, { token });
}

export async function fetchPricing(token: string, id: string): Promise<Pricing> {
  return apiClient<Pricing>(`${BASE}/${id}`, { token });
}
