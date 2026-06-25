import type { CreatePurchase, Purchase } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/purchases";

interface PaginatedPurchases {
  items: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchPurchases(
  token: string,
  opts?: { page?: number; status?: "pending" | "paid" },
): Promise<PaginatedPurchases> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.status) params.set("status", opts.status);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedPurchases>(`${BASE}${queryString}`, { token });
}

export async function createPurchase(
  token: string,
  data: CreatePurchase,
): Promise<Purchase> {
  return apiClient<Purchase>(BASE, { method: "POST", body: data, token });
}

export async function payPurchase(token: string, id: string): Promise<Purchase> {
  return apiClient<Purchase>(`${BASE}/${id}/pay`, { method: "POST", token });
}

export async function deletePurchase(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
