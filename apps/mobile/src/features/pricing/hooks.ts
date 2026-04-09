import type { CreatePricing } from "@lucro-caseiro/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { calculatePricing, fetchPricing, fetchPricingHistory } from "./api";

const PRICING_KEY = ["pricing"];

export function useCalculatePricing() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (data: CreatePricing) => calculatePricing(token!, data),
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
