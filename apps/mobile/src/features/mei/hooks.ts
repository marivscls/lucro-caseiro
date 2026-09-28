import type { UpdateMeiSettings } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { fetchMeiSummary, updateMeiSettings } from "./api";

const MEI_KEY = ["mei"];

export function useMeiSummary(year: number, month: number) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...MEI_KEY, "summary", year, month],
    queryFn: () => fetchMeiSummary(token!, year, month),
    enabled: !!token,
  });
}

export function useUpdateMeiSettings() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMeiSettings) => updateMeiSettings(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEI_KEY });
    },
  });
}
