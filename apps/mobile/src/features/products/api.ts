import type { CreateProduct, Product, UpdateProduct } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/products";

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchProducts(
  token: string,
  opts?: { page?: number; limit?: number; category?: string; search?: string },
): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.category) params.set("category", opts.category);
  if (opts?.search) params.set("search", opts.search);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedProducts>(`${BASE}${queryString}`, {
    token,
  });
}

export async function fetchProduct(token: string, id: string): Promise<Product> {
  return apiClient<Product>(`${BASE}/${id}`, { token });
}

export async function createProduct(
  token: string,
  data: CreateProduct,
): Promise<Product> {
  return apiClient<Product>(BASE, { method: "POST", body: data, token });
}

export async function updateProduct(
  token: string,
  id: string,
  data: UpdateProduct,
): Promise<Product> {
  return apiClient<Product>(`${BASE}/${id}`, { method: "PATCH", body: data, token });
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
