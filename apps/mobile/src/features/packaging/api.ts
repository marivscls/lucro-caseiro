import type {
  CreatePackaging,
  Packaging,
  UpdatePackaging,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/packaging";

interface PaginatedPackaging {
  items: Packaging[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchPackagingList(
  token: string,
  opts?: { page?: number },
): Promise<PaginatedPackaging> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedPackaging>(`${BASE}${queryString}`, { token });
}

export async function fetchPackaging(token: string, id: string): Promise<Packaging> {
  return apiClient<Packaging>(`${BASE}/${id}`, { token });
}

export async function createPackaging(
  token: string,
  data: CreatePackaging,
): Promise<Packaging> {
  return apiClient<Packaging>(BASE, { method: "POST", body: data, token });
}

export async function updatePackaging(
  token: string,
  id: string,
  data: UpdatePackaging,
): Promise<Packaging> {
  return apiClient<Packaging>(`${BASE}/${id}`, { method: "PATCH", body: data, token });
}

export async function deletePackaging(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}

export async function linkPackagingToProduct(
  token: string,
  packagingId: string,
  productId: string,
): Promise<void> {
  await apiClient(`${BASE}/${packagingId}/products/${productId}`, {
    method: "POST",
    token,
  });
}
