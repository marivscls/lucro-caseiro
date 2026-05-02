import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "../../shared/hooks/use-auth";
import { createMercadoPagoCheckout } from "./api";

export function useMercadoPagoCheckout() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkout = useCallback(
    async (plan: "monthly" | "annual") => {
      if (!token) {
        Alert.alert("Erro", "Faca login antes de assinar.");
        return;
      }

      setLoading(true);
      try {
        const { url } = await createMercadoPagoCheckout(token, plan);
        await WebBrowser.openBrowserAsync(url);
      } catch {
        Alert.alert(
          "Erro",
          "Nao foi possivel abrir o checkout do Mercado Pago. Tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  return { checkout, loading };
}
