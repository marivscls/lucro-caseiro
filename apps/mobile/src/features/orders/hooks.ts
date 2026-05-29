import type {
  CreateOrder,
  DeliverOrder,
  OrderStatus,
  UpdateOrder,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { createOrder, deleteOrder, deliverOrder, fetchOrders, updateOrder } from "./api";

const ORDERS_KEY = ["orders"];

export function useOrders(opts?: { status?: OrderStatus; from?: string; to?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ORDERS_KEY, opts],
    queryFn: () => fetchOrders(token!, opts),
    enabled: !!token,
  });
}

export function useCreateOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrder) => createOrder(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useUpdateOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrder }) =>
      updateOrder(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useDeliverOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeliverOrder }) =>
      deliverOrder(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      // Pode ter gerado receita no financeiro.
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useDeleteOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrder(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}
