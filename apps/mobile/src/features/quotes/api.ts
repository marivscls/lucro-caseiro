import type {
  ConvertQuote,
  CreateQuote,
  Quote,
  QuoteStatusType,
  UpdateQuote,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/quotes";

export interface QuotesPage {
  items: Quote[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchQuotes(
  token: string,
  opts?: { page?: number; status?: QuoteStatusType },
): Promise<QuotesPage> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.status) params.set("status", opts.status);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return apiClient<QuotesPage>(`${BASE}${suffix}`, { token });
}

export async function fetchQuote(token: string, id: string): Promise<Quote> {
  return apiClient<Quote>(`${BASE}/${id}`, { token });
}

export async function createQuote(token: string, data: CreateQuote): Promise<Quote> {
  return apiClient<Quote>(BASE, { method: "POST", body: data, token });
}

export async function updateQuote(
  token: string,
  id: string,
  data: UpdateQuote,
): Promise<Quote> {
  return apiClient<Quote>(`${BASE}/${id}`, { method: "PUT", body: data, token });
}

export async function updateQuoteStatus(
  token: string,
  id: string,
  status: QuoteStatusType,
): Promise<Quote> {
  return apiClient<Quote>(`${BASE}/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export async function convertQuote(
  token: string,
  id: string,
  data: ConvertQuote,
): Promise<Quote> {
  return apiClient<Quote>(`${BASE}/${id}/convert`, {
    method: "POST",
    body: data,
    token,
  });
}

export async function deleteQuote(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
