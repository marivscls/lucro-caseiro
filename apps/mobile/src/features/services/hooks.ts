import type { CreateService, UpdateService } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { createService, fetchServices, updateService } from "./api";

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
