import type { CreateSupplier, Supplier, UpdateSupplier } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/suppliers";

interface PaginatedSuppliers {
  items: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchSuppliers(
  token: string,
  opts?: { page?: number; search?: string },
): Promise<PaginatedSuppliers> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.search) params.set("search", opts.search);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedSuppliers>(`${BASE}${queryString}`, { token });
}

export async function fetchSupplier(token: string, id: string): Promise<Supplier> {
  return apiClient<Supplier>(`${BASE}/${id}`, { token });
}

export async function createSupplier(
  token: string,
  data: CreateSupplier,
): Promise<Supplier> {
  return apiClient<Supplier>(BASE, { method: "POST", body: data, token });
}

export async function updateSupplier(
  token: string,
  id: string,
  data: UpdateSupplier,
): Promise<Supplier> {
  return apiClient<Supplier>(`${BASE}/${id}`, { method: "PATCH", body: data, token });
}

export async function deleteSupplier(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
