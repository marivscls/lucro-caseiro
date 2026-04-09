import type { CreateSale, Sale, UpdateSaleStatus } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

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

export async function fetchSales(
  token: string,
  opts?: { page?: number; status?: string; clientId?: string },
): Promise<PaginatedSales> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.status) params.set("status", opts.status);
  if (opts?.clientId) params.set("clientId", opts.clientId);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedSales>(`${BASE}${queryString}`, { token });
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
