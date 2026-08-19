import type {
  CreateResaleSerial,
  CreateVerticalAsset,
  CreateVerticalDocument,
  ResaleSerial,
  VerticalDocumentKind,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useAuth } from "../../shared/hooks/use-auth";
import * as api from "./api";

const KEY = ["verticals"];

function useVerticalMutation<TInput, TResult>(
  mutationFn: (token: string, input: TInput) => Promise<TResult>,
) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => mutationFn(token!, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useVerticalMembership() {
  const { token } = useAuth();
  const mutation = useMutation({
    mutationFn: () => api.touchVerticalMembership(token!),
  });
  const attemptedToken = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (token && attemptedToken.current !== token) {
      attemptedToken.current = token;
      mutation.mutate();
    }
  }, [token, mutation.mutate]);
  return mutation;
}

export function useFamilyMemberships() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "memberships"],
    queryFn: () => api.fetchVerticalMemberships(token!),
    enabled: !!token,
  });
}

export function useVerticalDashboard() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "dashboard"],
    queryFn: () => api.fetchVerticalDashboard(token!),
    enabled: !!token,
  });
}

export function useVerticalDocuments(kind?: VerticalDocumentKind) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "documents", kind ?? "all"],
    queryFn: () => api.fetchVerticalDocuments(token!, kind),
    enabled: !!token,
  });
}

export function useCreateVerticalDocument() {
  return useVerticalMutation<
    CreateVerticalDocument,
    Awaited<ReturnType<typeof api.createVerticalDocument>>
  >(api.createVerticalDocument);
}

export function useTransitionVerticalDocument() {
  return useVerticalMutation<
    { id: string; status: string; idempotencyKey: string },
    Awaited<ReturnType<typeof api.transitionVerticalDocument>>
  >(api.transitionVerticalDocument);
}

export function useVerticalAssets(enabled: boolean) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "assets"],
    queryFn: () => api.fetchVerticalAssets(token!),
    enabled: !!token && enabled,
  });
}

export function useCreateVerticalAsset() {
  return useVerticalMutation<
    CreateVerticalAsset,
    Awaited<ReturnType<typeof api.createVerticalAsset>>
  >(api.createVerticalAsset);
}

export function useResaleSerials(enabled: boolean) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "serials"],
    queryFn: () => api.fetchResaleSerials(token!),
    enabled: !!token && enabled,
  });
}

export function useCreateResaleSerial() {
  return useVerticalMutation<
    CreateResaleSerial,
    Awaited<ReturnType<typeof api.createResaleSerial>>
  >(api.createResaleSerial);
}

export function useUpdateResaleSerialStatus() {
  return useVerticalMutation<
    {
      id: string;
      expectedStatus: ResaleSerial["status"];
      status: ResaleSerial["status"];
    },
    Awaited<ReturnType<typeof api.updateResaleSerialStatus>>
  >(api.updateResaleSerialStatus);
}
