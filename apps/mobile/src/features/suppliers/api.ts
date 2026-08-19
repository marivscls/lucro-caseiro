import type {
  CreateSupplier,
  Supplier,
  SuppliersOverview,
  UpdateSupplier,
} from "@lucro-caseiro/contracts";

import { ApiError, apiClient } from "../../shared/utils/api-client";
import { fetchPurchases } from "../purchases/api";
import { buildLegacySuppliersOverview } from "./domain";

const BASE = "/api/v1/suppliers";

type SupplierPayload = Pick<
  Supplier,
  "id" | "userId" | "name" | "phone" | "email" | "address" | "notes" | "createdAt"
> &
  Partial<Supplier>;

interface PaginatedSuppliersPayload {
  items: SupplierPayload[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type PaginatedSuppliers = Omit<PaginatedSuppliersPayload, "items"> & {
  items: Supplier[];
};

function normalizeSupplier(supplier: SupplierPayload): Supplier {
  return {
    ...supplier,
    category: supplier.category ?? "other",
    hasWhatsApp: supplier.hasWhatsApp ?? false,
    purchaseDescription: supplier.purchaseDescription ?? null,
    isPreferred: supplier.isPreferred ?? false,
    avatarType: supplier.avatarType ?? "initials",
    avatarPresetId: supplier.avatarPresetId ?? null,
    avatarUrl: supplier.avatarUrl ?? null,
    needsFollowUp: supplier.needsFollowUp ?? false,
    restockSoon: supplier.restockSoon ?? false,
    isActive: supplier.isActive ?? true,
    updatedAt: supplier.updatedAt ?? supplier.createdAt,
  };
}

export async function fetchSuppliers(
  token: string,
  opts?: { page?: number; limit?: number; search?: string },
): Promise<PaginatedSuppliers> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.search) params.set("search", opts.search);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  const response = await apiClient<PaginatedSuppliersPayload>(`${BASE}${queryString}`, {
    token,
  });
  return { ...response, items: response.items.map(normalizeSupplier) };
}

export async function fetchSupplier(token: string, id: string): Promise<Supplier> {
  const supplier = await apiClient<SupplierPayload>(`${BASE}/${id}`, { token });
  return normalizeSupplier(supplier);
}

export async function fetchSuppliersOverview(token: string): Promise<SuppliersOverview> {
  try {
    return await apiClient<SuppliersOverview>(`${BASE}/overview`, { token });
  } catch (error) {
    if (!(error instanceof ApiError) || ![400, 404, 500].includes(error.status)) {
      throw error;
    }

    const firstSuppliers = await fetchSuppliers(token, { page: 1, limit: 100 });
    const firstPurchases = await fetchPurchases(token, { page: 1, limit: 100 });
    const suppliers = [...firstSuppliers.items];
    const purchases = [...firstPurchases.items];
    for (let page = 2; page <= firstSuppliers.totalPages; page += 1) {
      suppliers.push(...(await fetchSuppliers(token, { page, limit: 100 })).items);
    }
    for (let page = 2; page <= firstPurchases.totalPages; page += 1) {
      purchases.push(...(await fetchPurchases(token, { page, limit: 100 })).items);
    }
    return buildLegacySuppliersOverview(suppliers, purchases);
  }
}

export async function createSupplier(
  token: string,
  data: CreateSupplier,
): Promise<Supplier> {
  const supplier = await apiClient<SupplierPayload>(BASE, {
    method: "POST",
    body: data,
    token,
  });
  return normalizeSupplier(supplier);
}

export async function updateSupplier(
  token: string,
  id: string,
  data: UpdateSupplier,
): Promise<Supplier> {
  const supplier = await apiClient<SupplierPayload>(`${BASE}/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
  return normalizeSupplier(supplier);
}

export async function deleteSupplier(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
