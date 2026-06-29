import { useCallback, useState } from "react";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "../../shared/hooks/use-auth";
import { createStripeCheckout, fetchProfile } from "./api";
import { alertError } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";

const PROFILE_KEY = ["subscription", "profile"];

// A Stripe confirma a assinatura por webhook (assíncrono): o plano pode levar
// alguns segundos pra virar premium no backend depois que o checkout fecha. Um
// único invalidate corre na frente disso. Relemos o perfil algumas vezes até
// refletir — aí o botão "Desbloquear premium" some e a comemoração dispara
// sozinha (watcher de plano no _layout).
async function pollForPremium(token: string, queryClient: QueryClient) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    try {
      const profile = await fetchProfile(token);
      queryClient.setQueryData(PROFILE_KEY, profile);
      if (profile.plan === "premium") {
        await queryClient.invalidateQueries({ queryKey: ["subscription", "limits"] });
        return;
      }
    } catch {
      // Falha de rede momentânea: tenta de novo na próxima volta.
    }
  }
}

export function useStripeCheckout() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const checkout = useCallback(
    async (plan: "monthly" | "annual") => {
      if (!token) {
        alertError("Faça login antes de assinar.");
        return;
      }

      setLoading(true);
      try {
        const { url } = await createStripeCheckout(token, plan);
        await WebBrowser.openBrowserAsync(url);
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
        void pollForPremium(token, queryClient);
      } catch {
        showAlert({
          title: "Erro",
          message: "Não foi possível abrir o checkout da Stripe. Tente novamente.",
        });
      } finally {
        setLoading(false);
      }
    },
    [queryClient, token],
  );

  return { checkout, loading };
}
