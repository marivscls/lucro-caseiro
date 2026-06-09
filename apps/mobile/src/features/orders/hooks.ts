import type {
  CreateOrder,
  DeliverOrder,
  Order,
  OrderStatus,
  UpdateOrder,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createOrder,
  deleteOrder,
  deliverOrder,
  fetchOrders,
  fetchOrdersSummary,
  updateOrder,
} from "./api";
import { cancelOrderReminder, scheduleOrderReminder } from "./reminders";

const ORDERS_KEY = ["orders"];
const ORDERS_SUMMARY_KEY = ["orders", "summary"];

export function useOrders(opts?: { status?: OrderStatus; from?: string; to?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ORDERS_KEY, opts],
    queryFn: () => fetchOrders(token!, opts),
    enabled: !!token,
  });
}

export function useOrdersSummary(opts?: {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ORDERS_SUMMARY_KEY, opts],
    queryFn: () => fetchOrdersSummary(token!, opts),
    enabled: !!token,
  });
}

export function useCreateOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrder) => createOrder(token!, data),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      void scheduleOrderReminder(order);
    },
  });
}

export function useUpdateOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrder }) =>
      updateOrder(token!, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ORDERS_KEY });
      const snapshots = queryClient.getQueriesData<Order[]>({ queryKey: ORDERS_KEY });

      for (const [queryKey, orders] of snapshots) {
        if (!orders) continue;
        queryClient.setQueryData<Order[]>(
          queryKey,
          orders.map((order) => (order.id === id ? { ...order, ...data } : order)),
        );
      }

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, orders] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, orders);
      }
    },
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      // Reagenda (data/status podem ter mudado).
      void scheduleOrderReminder(order);
    },
  });
}

export function useDeliverOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeliverOrder }) =>
      deliverOrder(token!, id, data),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      // Pode ter gerado receita no financeiro.
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
      void cancelOrderReminder(order.id);
    },
  });
}

export function useDeleteOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrder(token!, id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      void cancelOrderReminder(id);
    },
  });
}
