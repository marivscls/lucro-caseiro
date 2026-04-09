import type { CreateFinanceEntry, UpdateFinanceEntry } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { createEntry, deleteEntry, fetchEntries, fetchSummary, updateEntry } from "./api";

const FINANCE_KEY = ["finance"];

export function useFinanceEntries(opts?: {
  page?: number;
  type?: string;
  category?: string;
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
