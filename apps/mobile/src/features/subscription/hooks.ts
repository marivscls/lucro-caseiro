import type { UpdateProfile } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { fetchLimits, fetchProfile, updateProfile } from "./api";

const SUBSCRIPTION_KEY = ["subscription"];

export function useProfile() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SUBSCRIPTION_KEY, "profile"],
    queryFn: () => fetchProfile(token!),
    enabled: !!token,
  });
}

export function useLimits() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SUBSCRIPTION_KEY, "limits"],
    queryFn: () => fetchLimits(token!),
    enabled: !!token,
  });
}

export function useUpdateProfile() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfile) => updateProfile(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
    },
  });
}
