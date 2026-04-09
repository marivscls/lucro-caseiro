import type { CreateProduct, UpdateProduct } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createProduct,
  deleteProduct,
  fetchProduct,
  fetchProducts,
  updateProduct,
} from "./api";

const PRODUCTS_KEY = ["products"];

export function useProducts(opts?: {
  page?: number;
  category?: string;
  search?: string;
}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRODUCTS_KEY, opts],
    queryFn: () => fetchProducts(token!, opts),
    enabled: !!token,
  });
}

export function useProduct(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRODUCTS_KEY, id],
    queryFn: () => fetchProduct(token!, id),
    enabled: !!token && !!id,
  });
}

export function useCreateProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProduct) => createProduct(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useUpdateProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProduct }) =>
      updateProduct(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useDeleteProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
