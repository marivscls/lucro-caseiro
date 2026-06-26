import type { CreateSale, Sale, SaleStatus } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  type UpdateSaleData,
  createSale,
  fetchSale,
  fetchSales,
  fetchTodaySummary,
  updateSale,
  updateSaleStatus,
} from "./api";

const SALES_KEY = ["sales"];

export function useSales(opts?: { page?: number; status?: string; clientId?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SALES_KEY, opts],
    queryFn: () => fetchSales(token!, opts),
    enabled: !!token,
  });
}

export function useSale(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SALES_KEY, id],
    queryFn: () => fetchSale(token!, id),
    enabled: !!token && !!id,
  });
}

export function useTodaySummary() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SALES_KEY, "summary", "today"],
    queryFn: () => fetchTodaySummary(token!),
    enabled: !!token,
    refetchInterval: 60_000,
  });
}

export function useCreateSale() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSale) => createSale(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALES_KEY });
      // A venda da baixa no estoque no backend; revalida produtos para
      // refletir o novo saldo e disparar o alerta de estoque baixo.
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      // Atualiza a contagem de limites (vendas do mes) para o gate do plano
      // gratuito bloquear na hora certa, sem depender de contagem defasada.
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

type SalesListCache = { items: Sale[] } & Record<string, unknown>;

export function useUpdateSaleStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SaleStatus }) =>
      updateSaleStatus(token!, id, { status }),
    // Atualização otimista: reflete o novo status na hora em todas as listas de
    // vendas em cache (ex.: a venda paga sai do fiado imediatamente), com
    // rollback se a API falhar. onSettled reconcilia com o servidor.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: SALES_KEY });
      const snapshots = queryClient.getQueriesData<SalesListCache>({
        queryKey: SALES_KEY,
      });
      for (const [key, data] of snapshots) {
        if (!data?.items) continue;
        queryClient.setQueryData<SalesListCache>(key, {
          ...data,
          items: data.items.map((sale) => (sale.id === id ? { ...sale, status } : sale)),
        });
      }
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SALES_KEY });
    },
  });
}

export function useUpdateSale() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSaleData }) =>
      updateSale(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALES_KEY });
    },
  });
}
