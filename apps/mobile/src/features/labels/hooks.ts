import type { CreateLabel, UpdateLabel } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createLabel,
  deleteLabel,
  fetchLabel,
  fetchLabels,
  fetchTemplates,
  updateLabel,
} from "./api";

const LABELS_KEY = ["labels"];

export function useLabels(opts?: { page?: number; productId?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...LABELS_KEY, opts],
    queryFn: () => fetchLabels(token!, opts),
    enabled: !!token,
  });
}

export function useLabel(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...LABELS_KEY, id],
    queryFn: () => fetchLabel(token!, id),
    enabled: !!token && !!id,
  });
}

export function useTemplates() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...LABELS_KEY, "templates"],
    queryFn: () => fetchTemplates(token!),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useCreateLabel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabel) => createLabel(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LABELS_KEY });
    },
  });
}

export function useUpdateLabel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLabel }) =>
      updateLabel(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LABELS_KEY });
    },
  });
}

export function useDeleteLabel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLabel(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LABELS_KEY });
    },
  });
}
