import type {
  CreateProduct,
  Product,
  ProductCodeLookup,
  UpdateProduct,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/products";

interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchProducts(
  token: string,
  opts?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isComposite?: boolean;
  },
): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.category) params.set("category", opts.category);
  if (opts?.search) params.set("search", opts.search);
  if (opts?.isComposite !== undefined) {
    params.set("isComposite", String(opts.isComposite));
  }

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedProducts>(`${BASE}${queryString}`, {
    token,
  });
}

export async function fetchAllProducts(token: string): Promise<Product[]> {
  const firstPage = await fetchProducts(token, { page: 1, limit: 100 });
  if (firstPage.totalPages <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchProducts(token, { page: index + 2, limit: 100 }),
    ),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

export async function fetchProduct(token: string, id: string): Promise<Product> {
  return apiClient<Product>(`${BASE}/${id}`, { token });
}

export async function lookupProductByCode(
  token: string,
  code: string,
): Promise<ProductCodeLookup> {
  return apiClient<ProductCodeLookup>(
    `${BASE}/lookup/by-code/${encodeURIComponent(code.trim())}`,
    { token },
  );
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

export async function fetchLowStockProducts(token: string): Promise<Product[]> {
  return apiClient<Product[]>(`${BASE}/low-stock`, { token });
}
