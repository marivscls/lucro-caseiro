import type { CreateMaterial, UpdateMaterial } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  adjustMaterial,
  createMaterial,
  deleteMaterial,
  fetchLowStockMaterials,
  fetchMaterials,
  updateMaterial,
} from "./api";

const MATERIALS_KEY = ["materials"];

export function useMaterials(opts?: { page?: number; search?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...MATERIALS_KEY, opts],
    queryFn: () => fetchMaterials(token!, opts),
    enabled: !!token,
  });
}

export function useLowStockMaterials() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...MATERIALS_KEY, "low-stock"],
    queryFn: () => fetchLowStockMaterials(token!),
    enabled: !!token,
  });
}

export function useCreateMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterial) => createMaterial(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
    },
  });
}

export function useUpdateMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterial }) =>
      updateMaterial(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
    },
  });
}

export function useAdjustMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      adjustMaterial(token!, id, delta),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
    },
    onError: (err) => {
      Alert.alert(
        "Erro ao ajustar estoque",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    },
  });
}

export function useDeleteMaterial() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaterial(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
    },
  });
}
