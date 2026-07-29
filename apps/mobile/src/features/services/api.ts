import type {
  CreateService,
  PurchaseServicePackage,
  Service,
  ServiceBookingRequest,
  ServiceBookingRequestStatus,
  ServiceInsights,
  ServicePackagePurchase,
  UpdateService,
} from "@lucro-caseiro/contracts";

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

export async function fetchServiceInsights(
  token: string,
  id: string,
): Promise<ServiceInsights> {
  return apiClient<ServiceInsights>(`${BASE}/${id}/insights`, { token });
}

export async function fetchServiceBookingRequests(
  token: string,
  id: string,
): Promise<ServiceBookingRequest[]> {
  const response = await apiClient<{ items: ServiceBookingRequest[] }>(
    `${BASE}/${id}/booking-requests`,
    { token },
  );
  return response.items;
}

export async function updateServiceBookingRequest(
  token: string,
  id: string,
  status: ServiceBookingRequestStatus,
): Promise<ServiceBookingRequest> {
  return apiClient<ServiceBookingRequest>(`${BASE}/booking-requests/${id}`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export async function fetchServicePackagePurchases(
  token: string,
  serviceId?: string,
): Promise<ServicePackagePurchase[]> {
  const suffix = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : "";
  const response = await apiClient<{ items: ServicePackagePurchase[] }>(
    `${BASE}/package-purchases${suffix}`,
    { token },
  );
  return response.items;
}

export async function purchaseServicePackage(
  token: string,
  packageId: string,
  data: PurchaseServicePackage,
): Promise<ServicePackagePurchase> {
  return apiClient<ServicePackagePurchase>(`${BASE}/packages/${packageId}/purchases`, {
    method: "POST",
    body: data,
    token,
  });
}
