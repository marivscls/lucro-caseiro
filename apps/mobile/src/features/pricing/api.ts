import type {
  CreatePricing,
  Pricing,
  PricingPreferences,
  UpsertPricingPreferences,
} from "@lucro-caseiro/contracts";

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

export async function fetchPricingPreferences(
  token: string,
): Promise<PricingPreferences> {
  return apiClient<PricingPreferences>(`${BASE}/preferences`, { token });
}

export async function updatePricingPreferences(
  token: string,
  data: UpsertPricingPreferences,
): Promise<PricingPreferences> {
  return apiClient<PricingPreferences>(`${BASE}/preferences`, {
    method: "PUT",
    body: data,
    token,
  });
}

interface PaginatedPricing {
  items: Pricing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Lista todos os cálculos do usuário (opcionalmente filtrando por produto). */
export async function fetchPricingList(
  token: string,
  opts?: { page?: number; limit?: number; productId?: string },
): Promise<PaginatedPricing> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.productId) params.set("productId", opts.productId);
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  return apiClient<PaginatedPricing>(`${BASE}${suffix}`, { token });
}
