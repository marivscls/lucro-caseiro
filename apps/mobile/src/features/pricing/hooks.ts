import type {
  CreatePricing,
  FinanceSummary,
  PricingPreferences,
  UpsertPricingPreferences,
} from "@lucro-caseiro/contracts";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../analytics/tracker";
import { fetchSummary } from "../finance/api";
import {
  calculatePricing,
  fetchPricing,
  fetchPricingHistory,
  fetchPricingList,
  fetchPricingPreferences,
  updatePricingPreferences,
} from "./api";
import { averagePositiveRevenue, previousCompletedMonths } from "./calc";

const PRICING_KEY = ["pricing"];

export function useCalculatePricing() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePricing) => calculatePricing(token!, data),
    // Salvar um cálculo persiste no histórico; revalida a lista para o
    // "Histórico" mostrar o cálculo novo na hora (sem isso ficava stale 5min).
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRICING_KEY });
      void trackAnalyticsAction("pricing_completed", token);
    },
  });
}

/** Histórico completo (todos os cálculos do usuário), com filtro opcional por produto. */
export function usePricingList(opts?: { productId?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRICING_KEY, "list", opts ?? {}],
    queryFn: () => fetchPricingList(token!, { limit: 50, ...opts }),
    enabled: !!token,
  });
}

export function usePricingHistory(productId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRICING_KEY, "history", productId],
    queryFn: () => fetchPricingHistory(token!, productId),
    enabled: !!token && !!productId,
  });
}

export function usePricing(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRICING_KEY, id],
    queryFn: () => fetchPricing(token!, id),
    enabled: !!token && !!id,
  });
}

export function usePricingPreferences() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRICING_KEY, "preferences"],
    queryFn: () => fetchPricingPreferences(token!),
    enabled: !!token,
  });
}

export function useUpdatePricingPreferences() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertPricingPreferences) =>
      updatePricingPreferences(token!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<PricingPreferences>(
        [...PRICING_KEY, "preferences"],
        updated,
      );
    },
  });
}

export function usePricingRevenueHistory() {
  const { token } = useAuth();
  const periods = previousCompletedMonths();
  const queries = useQueries({
    queries: periods.map((period) => ({
      queryKey: ["finance", "summary", period],
      queryFn: () => fetchSummary(token!, period),
      enabled: !!token,
    })),
  });
  const summaries = queries
    .map((query) => query.data)
    .filter((summary): summary is FinanceSummary => !!summary && summary.totalIncome > 0);
  return {
    averageRevenue: averagePositiveRevenue(
      summaries.map((summary) => summary.totalIncome),
    ),
    periods: summaries.map((summary) => summary.period),
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.every((query) => query.isError),
  };
}
