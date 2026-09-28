import type { CreateSale, Sale, SaleStatus } from "@lucro-caseiro/contracts";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "../../shared/hooks/use-auth";
import { mergePages, nextPageParam } from "../../shared/utils/pagination";
import { trackAnalyticsAction } from "../analytics/tracker";
import {
  type SalesFilter,
  type UpdateSaleData,
  createSale,
  fetchAllSales,
  fetchSale,
  fetchSales,
  fetchTodaySummary,
  updateSale,
  updateSaleStatus,
} from "./api";

const SALES_KEY = ["sales"];

export function useSales(
  opts?: SalesFilter & { page?: number },
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SALES_KEY, opts],
    queryFn: () => fetchSales(token!, opts),
    enabled: !!token && enabled,
  });
}

/** Todas as vendas do filtro (todas as páginas). Use onde a tela soma a lista. */
export function useAllSales(opts?: SalesFilter) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SALES_KEY, "all", opts],
    queryFn: () => fetchAllSales(token!, opts),
    enabled: !!token,
  });
}

/** Lista que carrega mais vendas conforme a pessoa rola a tela. */
export function useSalesFeed(
  opts?: SalesFilter,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { token } = useAuth();
  const query = useInfiniteQuery({
    queryKey: [...SALES_KEY, "feed", opts],
    queryFn: ({ pageParam }) => fetchSales(token!, { ...opts, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled: !!token && enabled,
  });
  const pages = query.data?.pages;
  const data = useMemo(() => (pages ? mergePages(pages) : undefined), [pages]);
  return { ...query, data };
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
      void trackAnalyticsAction("sale_completed", token);
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
    onSuccess: (_sale, variables) => {
      if (variables.status === "paid")
        void trackAnalyticsAction("sale_payment_received", token);
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
