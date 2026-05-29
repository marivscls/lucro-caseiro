import type { CreateMaterial, Material, UpdateMaterial } from "@lucro-caseiro/contracts";
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

// Aplica o ajuste em um item (clamp em 0) — usado na atualização otimista.
function bumpStock(m: Material, id: string, delta: number): Material {
  if (m.id !== id) return m;
  return { ...m, stockQuantity: Math.max(0, m.stockQuantity + delta) };
}

// Atualiza qualquer cache de materials (lista paginada { items } ou low-stock []).
function patchMaterialsCache(old: unknown, id: string, delta: number): unknown {
  if (Array.isArray(old)) {
    return (old as Material[]).map((m) => bumpStock(m, id, delta));
  }
  if (
    old &&
    typeof old === "object" &&
    Array.isArray((old as { items?: unknown }).items)
  ) {
    const o = old as { items: Material[] };
    return { ...o, items: o.items.map((m) => bumpStock(m, id, delta)) };
  }
  return old;
}

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
    // Atualização otimista: reflete o +/- na hora, sem esperar a rede.
    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey: MATERIALS_KEY });
      const snapshots = queryClient.getQueriesData({ queryKey: MATERIALS_KEY });
      queryClient.setQueriesData({ queryKey: MATERIALS_KEY }, (old) =>
        patchMaterialsCache(old, id, delta),
      );
      return { snapshots };
    },
    onError: (err, _vars, context) => {
      context?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      Alert.alert(
        "Erro ao ajustar estoque",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    },
    // Resincroniza com o servidor depois (sucesso ou erro).
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
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
