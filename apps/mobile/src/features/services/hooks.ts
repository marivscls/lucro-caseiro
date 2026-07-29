import type {
  CreateService,
  PurchaseServicePackage,
  ServiceBookingRequestStatus,
  UpdateService,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createService,
  fetchServiceBookingRequests,
  fetchServiceInsights,
  fetchServicePackagePurchases,
  fetchServices,
  purchaseServicePackage,
  updateService,
  updateServiceBookingRequest,
} from "./api";

const SERVICES_KEY = ["services"];

export function useServices() {
  const { token } = useAuth();
  return useQuery({
    queryKey: SERVICES_KEY,
    queryFn: () => fetchServices(token!),
    enabled: !!token,
  });
}

export function useCreateService() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateService) => createService(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

export function useUpdateService() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateService }) =>
      updateService(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

export function useServiceInsights(serviceId?: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SERVICES_KEY, serviceId, "insights"],
    queryFn: () => fetchServiceInsights(token!, serviceId!),
    enabled: !!token && !!serviceId,
  });
}

export function useServiceBookingRequests(serviceId?: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SERVICES_KEY, serviceId, "booking-requests"],
    queryFn: () => fetchServiceBookingRequests(token!, serviceId!),
    enabled: !!token && !!serviceId,
  });
}

export function useUpdateServiceBookingRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceBookingRequestStatus }) =>
      updateServiceBookingRequest(token!, id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

export function useServicePackagePurchases(serviceId?: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SERVICES_KEY, serviceId, "package-purchases"],
    queryFn: () => fetchServicePackagePurchases(token!, serviceId ?? undefined),
    enabled: !!token && !!serviceId,
  });
}

export function usePurchaseServicePackage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      packageId,
      data,
    }: {
      packageId: string;
      data: PurchaseServicePackage;
    }) => purchaseServicePackage(token!, packageId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}
