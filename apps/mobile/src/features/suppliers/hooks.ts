import type { CreateSupplier, UpdateSupplier } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createSupplier,
  deleteSupplier,
  fetchSupplier,
  fetchSuppliers,
  updateSupplier,
} from "./api";

const SUPPLIERS_KEY = ["suppliers"];

export function useSuppliers(opts?: { page?: number; search?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, opts],
    queryFn: () => fetchSuppliers(token!, opts),
    enabled: !!token,
  });
}

export function useSupplier(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, id],
    queryFn: () => fetchSupplier(token!, id),
    enabled: !!token && !!id,
  });
}

export function useCreateSupplier() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplier) => createSupplier(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
      // Atualiza a contagem de limites do plano (fornecedores) pra o gate bloquear na hora certa.
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useUpdateSupplier() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplier }) =>
      updateSupplier(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
    },
  });
}

export function useDeleteSupplier() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
