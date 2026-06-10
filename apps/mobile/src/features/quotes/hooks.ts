import type {
  ConvertQuote,
  CreateQuote,
  QuoteStatusType,
  UpdateQuote,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  convertQuote,
  createQuote,
  deleteQuote,
  fetchQuote,
  fetchQuotes,
  updateQuote,
  updateQuoteStatus,
} from "./api";

const QUOTES_KEY = ["quotes"];

export function useQuotes(opts?: { page?: number; status?: QuoteStatusType }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...QUOTES_KEY, opts],
    queryFn: () => fetchQuotes(token!, opts),
    enabled: !!token,
  });
}

export function useQuote(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...QUOTES_KEY, id],
    queryFn: () => fetchQuote(token!, id!),
    enabled: !!token && !!id,
  });
}

function useInvalidatingMutation<TArgs, TResult>(
  fn: (token: string, args: TArgs) => Promise<TResult>,
  extraKeys: string[][] = [],
) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => fn(token!, args),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUOTES_KEY });
      for (const key of extraKeys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useCreateQuote() {
  return useInvalidatingMutation((token, data: CreateQuote) => createQuote(token, data));
}

export function useUpdateQuote() {
  return useInvalidatingMutation(
    (token, { id, data }: { id: string; data: UpdateQuote }) =>
      updateQuote(token, id, data),
  );
}

export function useUpdateQuoteStatus() {
  return useInvalidatingMutation(
    (token, { id, status }: { id: string; status: QuoteStatusType }) =>
      updateQuoteStatus(token, id, status),
  );
}

/** Conversao tambem invalida orders (a encomenda nova aparece na agenda). */
export function useConvertQuote() {
  return useInvalidatingMutation(
    (token, { id, data }: { id: string; data: ConvertQuote }) =>
      convertQuote(token, id, data),
    [["orders"]],
  );
}

export function useDeleteQuote() {
  return useInvalidatingMutation((token, id: string) => deleteQuote(token, id));
}
