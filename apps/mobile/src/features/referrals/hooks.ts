import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { claimReferral, fetchReferralSummary } from "./api";

const REFERRALS_KEY = ["referrals"];

export function useReferralSummary() {
  const { token } = useAuth();
  return useQuery({
    queryKey: REFERRALS_KEY,
    queryFn: () => fetchReferralSummary(token!),
    enabled: !!token,
  });
}

export function useClaimReferral() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => claimReferral(token!, code),
    onSuccess: (summary) => {
      queryClient.setQueryData(REFERRALS_KEY, summary);
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
