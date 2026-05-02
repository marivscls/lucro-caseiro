import type { CreateSale, SaleStatus } from "@lucro-caseiro/contracts";
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
    },
  });
}

export function useUpdateSaleStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SaleStatus }) =>
      updateSaleStatus(token!, id, { status }),
    onSuccess: () => {
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
