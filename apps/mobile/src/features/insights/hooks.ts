import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { fetchInsights } from "./api";

const INSIGHTS_KEY = ["insights"];

export function useInsights(months?: number, enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...INSIGHTS_KEY, months ?? 6],
    queryFn: () => fetchInsights(token!, months),
    enabled: !!token && enabled,
    // Troca de janela (3/6/12) mantém os dados anteriores na tela em vez de
    // derrubar tudo pro spinner; o gráfico atualiza quando a resposta chega.
    placeholderData: keepPreviousData,
  });
}
