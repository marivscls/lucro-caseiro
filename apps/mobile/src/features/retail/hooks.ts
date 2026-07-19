import type {
  CreateRetailDocument,
  CreateRetailPromotion,
  RetailDocumentKind,
  UpdateRetailDocument,
} from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import * as api from "./api";

const KEY = ["retail"];

function useRetailMutation<TData, TResult>(
  mutationFn: (token: string, data: TData) => Promise<TResult>,
) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TData) => mutationFn(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

export function useRetailDocuments(kind: RetailDocumentKind) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "documents", kind],
    queryFn: () => api.fetchRetailDocuments(token!, kind),
    enabled: !!token,
  });
}

export function useCreateRetailDocument() {
  return useRetailMutation<
    CreateRetailDocument,
    Awaited<ReturnType<typeof api.createRetailDocument>>
  >(api.createRetailDocument);
}

export function useUpdateRetailDocument() {
  return useRetailMutation<
    { id: string; data: UpdateRetailDocument },
    Awaited<ReturnType<typeof api.updateRetailDocument>>
  >((token, input) => api.updateRetailDocument(token, input.id, input.data));
}

export function useCashSession() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "cash"],
    queryFn: () => api.fetchCashSession(token!),
    enabled: !!token,
  });
}

export function useOpenCashSession() {
  return useRetailMutation<number, Awaited<ReturnType<typeof api.openCashSession>>>(
    (token, openingFloat) => api.openCashSession(token, openingFloat),
  );
}

export function useCloseCashSession() {
  return useRetailMutation<number, Awaited<ReturnType<typeof api.closeCashSession>>>(
    (token, countedCash) => api.closeCashSession(token, countedCash),
  );
}

export function useCashMovement() {
  return useRetailMutation<
    {
      type: "supply" | "withdrawal";
      paymentMethod: "cash";
      amount: number;
      note?: string;
    },
    Awaited<ReturnType<typeof api.createCashMovement>>
  >(api.createCashMovement);
}

export function useRetailCheckout() {
  return useRetailMutation<
    Parameters<typeof api.retailCheckout>[1],
    Awaited<ReturnType<typeof api.retailCheckout>>
  >(api.retailCheckout);
}

export function useRetailCheckoutQuote() {
  return useRetailMutation<
    Parameters<typeof api.quoteRetailCheckout>[1],
    Awaited<ReturnType<typeof api.quoteRetailCheckout>>
  >(api.quoteRetailCheckout);
}

export function useReplenishment() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "replenishment"],
    queryFn: () => api.fetchReplenishment(token!),
    enabled: !!token,
  });
}

export function useCreatePurchaseOrder() {
  return useRetailMutation<
    string | undefined,
    Awaited<ReturnType<typeof api.createPurchaseOrderFromReplenishment>>
  >(api.createPurchaseOrderFromReplenishment);
}

export function useFinalizeInventory() {
  return useRetailMutation<string, Awaited<ReturnType<typeof api.finalizeInventory>>>(
    api.finalizeInventory,
  );
}

export function usePromotions() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "promotions"],
    queryFn: () => api.fetchPromotions(token!),
    enabled: !!token,
  });
}

export function useCreatePromotion() {
  return useRetailMutation<
    CreateRetailPromotion,
    Awaited<ReturnType<typeof api.createPromotion>>
  >(api.createPromotion);
}

export function useBulkPriceUpdate() {
  return useRetailMutation<
    Parameters<typeof api.bulkUpdatePrices>[1],
    Awaited<ReturnType<typeof api.bulkUpdatePrices>>
  >(api.bulkUpdatePrices);
}

export function useBatchLabels() {
  return useRetailMutation<
    Parameters<typeof api.fetchBatchLabels>[1],
    Awaited<ReturnType<typeof api.fetchBatchLabels>>
  >(api.fetchBatchLabels);
}

export function useBusinessAccounts() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...KEY, "business-accounts"],
    queryFn: () => api.fetchBusinessAccounts(token!),
    enabled: !!token,
  });
}

export function useCreateBusinessAccount() {
  return useRetailMutation<
    Parameters<typeof api.createBusinessAccount>[1],
    Awaited<ReturnType<typeof api.createBusinessAccount>>
  >(api.createBusinessAccount);
}
