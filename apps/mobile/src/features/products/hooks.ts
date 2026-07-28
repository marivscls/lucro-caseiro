import type {
  CreateProduct,
  CreateStockAdjustment,
  UpdateProduct,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../analytics/tracker";
import {
  createProduct,
  adjustProductStock,
  deleteProduct,
  fetchAllProducts,
  fetchLowStockProducts,
  fetchProduct,
  fetchProducts,
  fetchSalesVelocity,
  fetchStockMovements,
  lookupProductByCode,
  updateProduct,
} from "./api";

const PRODUCTS_KEY = ["products"];

export function useProducts(opts?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isComposite?: boolean;
}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRODUCTS_KEY, opts],
    queryFn: () => fetchProducts(token!, opts),
    enabled: !!token,
  });
}

export function useAllProducts() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRODUCTS_KEY, "all"],
    queryFn: () => fetchAllProducts(token!),
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

export function useProductCodeLookup() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (code: string) => lookupProductByCode(token!, code),
  });
}

export function useCreateProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProduct) => createProduct(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      // Atualiza a contagem de limites do plano (produtos) pra o gate bloquear na hora certa.
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
      void trackAnalyticsAction("product_created", token);
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

export function useLowStockProducts() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRODUCTS_KEY, "low-stock"],
    queryFn: () => fetchLowStockProducts(token!),
    enabled: !!token,
  });
}

export function useDeleteProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useAdjustProductStock() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: CreateStockAdjustment;
    }) => adjustProductStock(token!, productId, data),
    onSuccess: (_movement, variables) => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_KEY, variables.productId, "movements"],
      });
    },
  });
}

export function useStockMovements(productId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRODUCTS_KEY, productId, "movements"],
    queryFn: () => fetchStockMovements(token!, productId),
    enabled: !!token && !!productId,
  });
}

export function useSalesVelocity() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PRODUCTS_KEY, "velocity"],
    queryFn: () => fetchSalesVelocity(token!),
    enabled: !!token,
  });
}
