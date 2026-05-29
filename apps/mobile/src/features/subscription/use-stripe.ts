import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "../../shared/hooks/use-auth";
import { createStripeCheckout } from "./api";

export function useStripeCheckout() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const checkout = useCallback(
    async (plan: "monthly" | "annual") => {
      if (!token) {
        Alert.alert("Erro", "Faça login antes de assinar.");
        return;
      }

      setLoading(true);
      try {
        const { url } = await createStripeCheckout(token, plan);
        await WebBrowser.openBrowserAsync(url);
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      } catch {
        Alert.alert(
          "Erro",
          "Não foi possível abrir o checkout da Stripe. Tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    },
    [queryClient, token],
  );

  return { checkout, loading };
}
