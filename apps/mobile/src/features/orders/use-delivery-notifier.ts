import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { useNotificationEnabled } from "../../shared/hooks/notification-prefs";
import { asyncStorage } from "../../shared/utils/async-storage";
import { upcomingCount } from "./domain";
import { useOrders } from "./hooks";
import { cancelOrderReminder, scheduleOrderReminder } from "./reminders";

// Garante no máximo uma notificação de agenda por dia.
const KEY = "deliveryNotifiedDate";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

async function maybeNotify(count: number): Promise<void> {
  if (count <= 0) return;

  const today = todayStr();
  let last: string | null = null;
  try {
    last = await asyncStorage.getItem(KEY);
  } catch {
    last = null;
  }
  if (last === today) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Sua agenda 📅",
      body:
        count === 1
          ? "Você tem 1 entrega próxima. Toque para ver."
          : `Você tem ${count} entregas próximas. Toque para ver.`,
      data: { type: NOTIFICATION_TYPES.DELIVERY },
    },
    trigger: null,
  });
  await asyncStorage.setItem(KEY, today);
}

/**
 * Dispara uma notificação local quando há entregas próximas (hoje/amanhã ou
 * atrasadas), no máximo uma vez por dia. Respeita a preferência "Lembretes de
 * entrega": desligada, cancela os lembretes já agendados e não dispara nada.
 */
export function useDeliveryNotifier(brandEnabled = true): void {
  const { data: orders } = useOrders();
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.DELIVERY);

  useEffect(() => {
    if (Platform.OS === "web" || !orders) return;

    if (!brandEnabled || !enabled) {
      // Desligado: remove os lembretes por encomenda já agendados.
      for (const order of orders) {
        void cancelOrderReminder(order.id);
      }
      return;
    }

    void maybeNotify(upcomingCount(orders, new Date()));
    // Garante o lembrete agendado por encomenda (cobre pedidos antigos e
    // reagenda se o SO tiver limpado os agendamentos). Idempotente.
    for (const order of orders) {
      void scheduleOrderReminder(order);
    }
  }, [orders, enabled, brandEnabled]);
}
