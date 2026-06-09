import type { UpdateCatalogSettings } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { fetchCatalogSettings, updateCatalogSettings } from "./api";

const CATALOG_KEY = ["catalog"];

export function useCatalogSettings() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...CATALOG_KEY, "settings"],
    queryFn: () => fetchCatalogSettings(token!),
    enabled: !!token,
  });
}

export function useUpdateCatalogSettings() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCatalogSettings) => updateCatalogSettings(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATALOG_KEY });
    },
  });
}
