import type { CreatePurchase, Purchase, UpdatePurchase } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";
import { normalizePurchase, type PurchasePayload } from "./domain";

const BASE = "/api/v1/purchases";

interface PaginatedPurchases {
  items: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type PaginatedPurchasesPayload = Omit<PaginatedPurchases, "items"> & {
  items: PurchasePayload[];
};

export async function fetchPurchases(
  token: string,
  opts?: { page?: number; status?: "pending" | "paid" },
): Promise<PaginatedPurchases> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.status) params.set("status", opts.status);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  const response = await apiClient<PaginatedPurchasesPayload>(`${BASE}${queryString}`, {
    token,
  });
  return {
    ...response,
    items: response.items.map(normalizePurchase),
  };
}

export async function createPurchase(
  token: string,
  data: CreatePurchase,
): Promise<Purchase> {
  const purchase = await apiClient<PurchasePayload>(BASE, {
    method: "POST",
    body: data,
    token,
  });
  return normalizePurchase(purchase);
}

export async function payPurchase(token: string, id: string): Promise<Purchase> {
  const purchase = await apiClient<PurchasePayload>(`${BASE}/${id}/pay`, {
    method: "POST",
    token,
  });
  return normalizePurchase(purchase);
}

export async function updatePurchase(
  token: string,
  id: string,
  data: UpdatePurchase,
): Promise<Purchase> {
  const purchase = await apiClient<PurchasePayload>(`${BASE}/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
  return normalizePurchase(purchase);
}

export async function deletePurchase(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
