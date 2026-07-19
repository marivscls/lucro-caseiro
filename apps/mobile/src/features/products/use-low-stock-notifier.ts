import type { Product } from "@lucro-caseiro/contracts";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { useNotificationEnabled } from "../../shared/hooks/notification-prefs";
import { asyncStorage } from "../../shared/utils/async-storage";
import { useLowStockProducts } from "./hooks";
import { availableProductStock } from "./variations";

// Guarda os IDs de produtos que já geraram alerta de estoque baixo, para não
// repetir a notificacao a cada refetch da lista.
const NOTIFIED_KEY = "lowStockNotifiedIds";

function buildContent(products: Product[]): Notifications.NotificationContentInput {
  const data = { type: NOTIFICATION_TYPES.LOW_STOCK, productId: products[0].id };

  if (products.length === 1) {
    const p = products[0];
    const quantity = availableProductStock(p);
    const body =
      quantity === 0
        ? `Acabou o estoque de ${p.name}. Toque para repor.`
        : `Restam ${quantity ?? 0} un. de ${p.name}. Toque para repor.`;
    return { title: "Estoque baixo 📦", body, data };
  }

  return {
    title: "Estoque baixo 📦",
    body: `${products.length} produtos estão acabando. Toque para ver.`,
    data,
  };
}

async function syncAndNotify(lowStock: Product[]): Promise<void> {
  const currentIds = lowStock.map((p) => p.id);

  let notified: string[] = [];
  try {
    const raw = await asyncStorage.getItem(NOTIFIED_KEY);
    if (raw) notified = JSON.parse(raw) as string[];
  } catch {
    notified = [];
  }

  // So notifica produtos que entraram na faixa de alerta desde a última checagem.
  const fresh = lowStock.filter((p) => !notified.includes(p.id));
  if (fresh.length > 0) {
    await Notifications.scheduleNotificationAsync({
      content: buildContent(fresh),
      trigger: null, // dispara imediatamente como notificacao local
    });
  }

  // Persiste apenas os IDs ainda baixos: produtos repostos saem da lista e
  // poderao alertar de novo quando o estoque cair outra vez.
  await asyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(currentIds));
}

/**
 * Observa os produtos com estoque baixo e dispara uma notificacao local quando
 * um produto novo entra na faixa de alerta. O dedupe via AsyncStorage evita
 * repetir o aviso do mesmo produto enquanto ele continua baixo.
 */
export function useLowStockNotifier(brandEnabled = true): void {
  const { data: lowStock } = useLowStockProducts();
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);

  useEffect(() => {
    if (Platform.OS === "web" || !brandEnabled || !enabled || !lowStock) return;
    void syncAndNotify(lowStock);
  }, [lowStock, enabled, brandEnabled]);
}
