import type { CreateLabel, Label, UpdateLabel } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/labels";

export interface PaginatedLabels {
  items: Label[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LabelTemplate {
  id: string;
  name: string;
}

export async function fetchLabels(
  token: string,
  opts?: { page?: number; productId?: string },
): Promise<PaginatedLabels> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.productId) params.set("productId", opts.productId);
  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedLabels>(`${BASE}${queryString}`, { token });
}

export async function fetchLabel(token: string, id: string): Promise<Label> {
  return apiClient<Label>(`${BASE}/${id}`, { token });
}

export async function fetchTemplates(token: string): Promise<LabelTemplate[]> {
  return apiClient<LabelTemplate[]>(`${BASE}/templates`, { token });
}

export async function createLabel(token: string, data: CreateLabel): Promise<Label> {
  return apiClient<Label>(BASE, { method: "POST", body: data, token });
}

export async function updateLabel(
  token: string,
  id: string,
  data: UpdateLabel,
): Promise<Label> {
  return apiClient<Label>(`${BASE}/${id}`, { method: "PATCH", body: data, token });
}

export async function deleteLabel(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
