import type { CreateMaterial, Material, UpdateMaterial } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/materials";

export interface PaginatedMaterials {
  items: Material[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchAllMaterials(token: string): Promise<PaginatedMaterials> {
  const firstPage = await fetchMaterials(token, { page: 1, limit: 100 });
  if (firstPage.totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchMaterials(token, { page: index + 2, limit: 100 }),
    ),
  );
  return {
    ...firstPage,
    items: [firstPage, ...remainingPages].flatMap((page) => page.items),
    limit: firstPage.total,
    totalPages: 1,
  };
}

export async function fetchMaterials(
  token: string,
  opts?: { page?: number; limit?: number; search?: string },
): Promise<PaginatedMaterials> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.search) params.set("search", opts.search);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return apiClient<PaginatedMaterials>(`${BASE}${suffix}`, { token });
}

export async function fetchLowStockMaterials(token: string): Promise<Material[]> {
  return apiClient<Material[]>(`${BASE}/low-stock`, { token });
}

export async function createMaterial(
  token: string,
  data: CreateMaterial,
): Promise<Material> {
  return apiClient<Material>(BASE, { method: "POST", body: data, token });
}

export async function updateMaterial(
  token: string,
  id: string,
  data: UpdateMaterial,
): Promise<Material> {
  return apiClient<Material>(`${BASE}/${id}`, { method: "PATCH", body: data, token });
}

export async function adjustMaterial(
  token: string,
  id: string,
  delta: number,
): Promise<Material> {
  return apiClient<Material>(`${BASE}/${id}/adjust`, {
    method: "POST",
    body: { delta },
    token,
  });
}

export async function deleteMaterial(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
