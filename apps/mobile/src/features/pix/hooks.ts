import type { UpdatePixSettings } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { createFiadoLink, fetchPixSettings, updatePixSettings } from "./api";

const PIX_KEY = ["pix"];

export function usePixSettings() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PIX_KEY, "settings"],
    queryFn: () => fetchPixSettings(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePixSettings() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePixSettings) => updatePixSettings(token!, data),
    onSuccess: (settings) => {
      queryClient.setQueryData([...PIX_KEY, "settings"], settings);
    },
  });
}

export function useCreateFiadoLink() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (clientId: string) => createFiadoLink(token!, clientId),
  });
}
