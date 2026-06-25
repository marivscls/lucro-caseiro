import type { CreatePurchase } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { createPurchase, deletePurchase, fetchPurchases, payPurchase } from "./api";

const PURCHASES_KEY = ["purchases"];

export function usePurchases(opts?: { status?: "pending" | "paid" }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PURCHASES_KEY, opts],
    queryFn: () => fetchPurchases(token!, opts),
    enabled: !!token,
  });
}

export function useCreatePurchase() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchase) => createPurchase(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      // Criar uma compra já paga gera uma saída no caixa → atualiza o financeiro.
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function usePayPurchase() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payPurchase(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useDeletePurchase() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePurchase(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
    },
  });
}
