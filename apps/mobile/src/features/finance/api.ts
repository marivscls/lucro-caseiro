import type {
  CreateFinanceEntry,
  FinanceEntry,
  FinanceSummary,
  UpdateFinanceEntry,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/finance";

interface PaginatedFinance {
  items: FinanceEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchEntries(
  token: string,
  opts?: { page?: number; type?: string; category?: string },
): Promise<PaginatedFinance> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.type) params.set("type", opts.type);
  if (opts?.category) params.set("category", opts.category);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedFinance>(`${BASE}${queryString}`, { token });
}

export async function fetchSummary(
  token: string,
  opts?: { month?: number; year?: number },
): Promise<FinanceSummary> {
  const params = new URLSearchParams();
  if (opts?.month) params.set("month", String(opts.month));
  if (opts?.year) params.set("year", String(opts.year));

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<FinanceSummary>(`${BASE}/summary${queryString}`, {
    token,
  });
}

export async function createEntry(
  token: string,
  data: CreateFinanceEntry,
): Promise<FinanceEntry> {
  return apiClient<FinanceEntry>(BASE, { method: "POST", body: data, token });
}

export async function updateEntry(
  token: string,
  id: string,
  data: UpdateFinanceEntry,
): Promise<FinanceEntry> {
  return apiClient<FinanceEntry>(`${BASE}/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export async function deleteEntry(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export function getExportUrl(format: "pdf" | "xlsx", month: string): string {
  return `${API_URL}${BASE}/export/${format}?month=${month}`;
}
