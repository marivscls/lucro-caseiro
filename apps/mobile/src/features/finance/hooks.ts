import type {
  CreateFinanceEntry,
  CreateRecurringExpense,
  RecurringExpense,
  UpdateFinanceEntry,
  UpdateRecurringExpense,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createEntry,
  createRecurring,
  deleteEntry,
  deleteRecurring,
  fetchEntries,
  fetchRecurring,
  fetchSummary,
  updateEntry,
  updateRecurring,
} from "./api";

const FINANCE_KEY = ["finance"];
const RECURRING_KEY = ["finance", "recurring"];

export function useFinanceEntries(opts?: {
  page?: number;
  type?: string;
  category?: string;
  fixed?: boolean;
}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...FINANCE_KEY, "entries", opts],
    queryFn: () => fetchEntries(token!, opts),
    enabled: !!token,
  });
}

export function useFinanceSummary(opts?: { month?: number; year?: number }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...FINANCE_KEY, "summary", opts],
    queryFn: () => fetchSummary(token!, opts),
    enabled: !!token,
  });
}

export function useCreateFinanceEntry() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFinanceEntry) => createEntry(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
    },
  });
}

export function useUpdateFinanceEntry() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinanceEntry }) =>
      updateEntry(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
    },
  });
}

export function useDeleteFinanceEntry() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEntry(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
    },
  });
}

// --- Gastos recorrentes ---

export function useRecurringExpenses() {
  const { token } = useAuth();
  return useQuery({
    queryKey: RECURRING_KEY,
    queryFn: () => fetchRecurring(token!),
    enabled: !!token,
  });
}

export function useCreateRecurring() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: "create-recurring-expense" },
    mutationFn: (data: CreateRecurringExpense) => createRecurring(token!, data),
    onSuccess: (created) => {
      queryClient.setQueryData<RecurringExpense[]>(RECURRING_KEY, (current = []) => [
        created,
        ...current.filter((item) => item.id !== created.id),
      ]);
    },
  });
}

export function useUpdateRecurring() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: "update-recurring-expense" },
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpense }) =>
      updateRecurring(token!, id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<RecurringExpense[]>(RECURRING_KEY, (current = []) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    },
  });
}

export function useDeleteRecurring() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: "delete-recurring-expense" },
    mutationFn: (id: string) => deleteRecurring(token!, id),
    onSuccess: (_result, deletedId) => {
      queryClient.setQueryData<RecurringExpense[]>(RECURRING_KEY, (current = []) =>
        current.filter((item) => item.id !== deletedId),
      );
    },
  });
}
