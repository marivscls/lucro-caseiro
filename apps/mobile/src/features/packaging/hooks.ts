import type { CreatePackaging, UpdatePackaging } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createPackaging,
  deletePackaging,
  fetchPackaging,
  fetchPackagingList,
  linkPackagingToProduct,
  updatePackaging,
} from "./api";

const PACKAGING_KEY = ["packaging"];

export function usePackagingList(opts?: { page?: number }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PACKAGING_KEY, opts],
    queryFn: () => fetchPackagingList(token!, opts),
    enabled: !!token,
  });
}

export function usePackaging(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PACKAGING_KEY, id],
    queryFn: () => fetchPackaging(token!, id),
    enabled: !!token && !!id,
  });
}

export function useCreatePackaging() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePackaging) => createPackaging(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PACKAGING_KEY });
    },
  });
}

export function useUpdatePackaging() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackaging }) =>
      updatePackaging(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PACKAGING_KEY });
    },
  });
}

export function useDeletePackaging() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePackaging(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PACKAGING_KEY });
    },
  });
}

export function useLinkPackagingToProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      packagingId,
      productId,
    }: {
      packagingId: string;
      productId: string;
    }) => linkPackagingToProduct(token!, packagingId, productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PACKAGING_KEY });
    },
  });
}
