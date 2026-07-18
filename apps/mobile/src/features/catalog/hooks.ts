import type { CatalogSettings, UpdateCatalogSettings } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../analytics/tracker";
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
    // Evita que salvamentos rapidos (imagem, switch e formulario) leiam o mesmo
    // estado antigo no backend e o ultimo sobrescreva campos do anterior.
    scope: { id: "update-catalog-settings" },
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
    onSuccess: (settings, data, context) => {
      queryClient.setQueryData(settingsKey, settings);
      if (data.enabled === true && context?.previous?.enabled === false) {
        void trackAnalyticsAction("catalog_published", token);
      }
    },
  });
}
