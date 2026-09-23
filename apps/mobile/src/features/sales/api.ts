import type { CreateSale, Sale, UpdateSaleStatus } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";
import { MAX_PAGE_SIZE, fetchAllPages } from "../../shared/utils/pagination";

const BASE = "/api/v1/sales";

interface PaginatedSales {
  items: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DaySummary {
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
}

export interface SalesFilter {
  status?: string;
  clientId?: string;
}

export async function fetchSales(
  token: string,
  opts?: SalesFilter & { page?: number; limit?: number },
): Promise<PaginatedSales> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.status) params.set("status", opts.status);
  if (opts?.clientId) params.set("clientId", opts.clientId);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedSales>(`${BASE}${queryString}`, { token });
}

/** Todas as vendas do filtro, para telas que somam a lista inteira. */
export async function fetchAllSales(
  token: string,
  opts?: SalesFilter,
): Promise<PaginatedSales> {
  return fetchAllPages((page) =>
    fetchSales(token, { ...opts, page, limit: MAX_PAGE_SIZE }),
  );
}

export async function fetchSale(token: string, id: string): Promise<Sale> {
  return apiClient<Sale>(`${BASE}/${id}`, { token });
}

export async function fetchTodaySummary(token: string): Promise<DaySummary> {
  return apiClient<DaySummary>(`${BASE}/summary/today`, { token });
}

export async function createSale(token: string, data: CreateSale): Promise<Sale> {
  return apiClient<Sale>(BASE, { method: "POST", body: data, token });
}

export async function updateSaleStatus(
  token: string,
  id: string,
  data: UpdateSaleStatus,
): Promise<Sale> {
  return apiClient<Sale>(`${BASE}/${id}/status`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export interface UpdateSaleData {
  clientId?: string;
  paymentMethod?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    variationId?: string;
    variationName?: string;
  }>;
  notes?: string;
}

export async function updateSale(
  token: string,
  id: string,
  data: UpdateSaleData,
): Promise<Sale> {
  return apiClient<Sale>(`${BASE}/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
}
