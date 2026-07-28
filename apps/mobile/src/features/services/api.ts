import type { CreateService, Service, UpdateService } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/orders/services";

export async function fetchServices(token: string): Promise<Service[]> {
  const response = await apiClient<{ items: Service[] }>(BASE, { token });
  return response.items;
}

export async function createService(
  token: string,
  data: CreateService,
): Promise<Service> {
  return apiClient<Service>(BASE, {
    method: "POST",
    body: data,
    token,
  });
}

export async function updateService(
  token: string,
  id: string,
  data: UpdateService,
): Promise<Service> {
  return apiClient<Service>(`${BASE}/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
}
