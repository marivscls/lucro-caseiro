import type { Client, CreateClient, UpdateClient } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/clients";

interface PaginatedClients {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchClients(
  token: string,
  opts?: { page?: number; search?: string },
): Promise<PaginatedClients> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.search) params.set("search", opts.search);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedClients>(`${BASE}${queryString}`, { token });
}

export async function fetchClient(token: string, id: string): Promise<Client> {
  return apiClient<Client>(`${BASE}/${id}`, { token });
}

export async function fetchBirthdays(token: string): Promise<Client[]> {
  return apiClient<Client[]>(`${BASE}/birthdays`, { token });
}

export async function createClient(token: string, data: CreateClient): Promise<Client> {
  return apiClient<Client>(BASE, { method: "POST", body: data, token });
}

export async function updateClient(
  token: string,
  id: string,
  data: UpdateClient,
): Promise<Client> {
  return apiClient<Client>(`${BASE}/${id}`, { method: "PATCH", body: data, token });
}

export async function deleteClient(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
