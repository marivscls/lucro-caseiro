import type { AssistantSaleRequest } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { draftSale, fetchAssistantUsage } from "./api";

const ASSISTANT_KEY = ["assistant"];

export function useAssistantUsage() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ASSISTANT_KEY, "usage"],
    queryFn: () => fetchAssistantUsage(token!),
    enabled: !!token,
  });
}

export function useDraftSale() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssistantSaleRequest) => draftSale(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ASSISTANT_KEY });
    },
  });
}
