import type { CreateClient, UpdateClient } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createClient,
  deleteClient,
  fetchBirthdays,
  fetchClient,
  fetchClients,
  updateClient,
} from "./api";

const CLIENTS_KEY = ["clients"];

export function useClients(opts?: { page?: number; search?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...CLIENTS_KEY, opts],
    queryFn: () => fetchClients(token!, opts),
    enabled: !!token,
  });
}

export function useClient(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...CLIENTS_KEY, id],
    queryFn: () => fetchClient(token!, id),
    enabled: !!token && !!id,
  });
}

export function useBirthdays() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...CLIENTS_KEY, "birthdays"],
    queryFn: () => fetchBirthdays(token!),
    enabled: !!token,
  });
}

export function useCreateClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClient) => createClient(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}

export function useUpdateClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClient }) =>
      updateClient(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}

export function useDeleteClient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}
