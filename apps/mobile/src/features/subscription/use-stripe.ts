import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "../../shared/hooks/use-auth";
import { createStripeCheckout } from "./api";
import { alertError } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";

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
