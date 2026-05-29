import type {
  CreateOrder,
  DeliverOrder,
  Order,
  OrderStatus,
  UpdateOrder,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/orders";

export async function fetchOrders(
  token: string,
  opts?: { status?: OrderStatus; from?: string; to?: string },
): Promise<Order[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  const res = await apiClient<{ items: Order[] }>(`${BASE}${suffix}`, { token });
  return res.items;
}

export async function createOrder(token: string, data: CreateOrder): Promise<Order> {
  return apiClient<Order>(BASE, { method: "POST", body: data, token });
}

export async function updateOrder(
  token: string,
  id: string,
  data: UpdateOrder,
): Promise<Order> {
  return apiClient<Order>(`${BASE}/${id}`, { method: "PATCH", body: data, token });
}

export async function deliverOrder(
  token: string,
  id: string,
  data: DeliverOrder,
): Promise<Order> {
  return apiClient<Order>(`${BASE}/${id}/deliver`, {
    method: "POST",
    body: data,
    token,
  });
}

export async function deleteOrder(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
