import type { UpsertProlaboreGoal } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { deleteProlaboreGoal, fetchProlaboreStatus, upsertProlaboreGoal } from "./api";

const GOALS_KEY = ["goals"];

export function useProlaboreStatus() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...GOALS_KEY, "prolabore"],
    queryFn: () => fetchProlaboreStatus(token!),
    enabled: !!token,
  });
}

export function useUpsertProlaboreGoal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertProlaboreGoal) => upsertProlaboreGoal(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
  });
}

export function useDeleteProlaboreGoal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteProlaboreGoal(token!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
  });
}
