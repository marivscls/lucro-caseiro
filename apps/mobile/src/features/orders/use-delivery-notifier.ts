import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { upcomingCount } from "./domain";
import { useOrders } from "./hooks";

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
    last = await AsyncStorage.getItem(KEY);
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
  await AsyncStorage.setItem(KEY, today);
}

/**
 * Dispara uma notificação local quando há entregas próximas (hoje/amanhã ou
 * atrasadas), no máximo uma vez por dia.
 */
export function useDeliveryNotifier(): void {
  const { data: orders } = useOrders();

  useEffect(() => {
    if (!orders) return;
    void maybeNotify(upcomingCount(orders, new Date()));
  }, [orders]);
}
