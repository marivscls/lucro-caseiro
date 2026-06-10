import type { CatalogSettings, UpdateCatalogSettings } from "@lucro-caseiro/contracts";
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
  const settingsKey = [...CATALOG_KEY, "settings"];
  return useMutation({
    mutationFn: (data: UpdateCatalogSettings) => updateCatalogSettings(token!, data),
    // Atualizacao otimista: a selecao (cor/estampa/switch) aparece na hora;
    // se o servidor rejeitar, reverte para o estado anterior.
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: settingsKey });
      const previous = queryClient.getQueryData<CatalogSettings>(settingsKey);
      if (previous) {
        queryClient.setQueryData<CatalogSettings>(settingsKey, {
          ...previous,
          ...data,
        } as CatalogSettings);
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CATALOG_KEY });
    },
  });
}
