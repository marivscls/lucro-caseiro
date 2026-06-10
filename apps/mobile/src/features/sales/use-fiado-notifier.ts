import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { formatCurrency } from "../../shared/utils/format";
import { oldFiadoSummary } from "./fiado";
import { useSales } from "./hooks";

// Lembra de cobrar fiado antigo, no máximo uma vez a cada N dias.
const KEY = "fiadoNotifiedAt";
const MIN_AGE_DAYS = 7; // fiado conta como "antigo" depois de 1 semana
const COOLDOWN_DAYS = 3; // espaco entre lembretes para nao virar spam

async function maybeNotify(count: number, total: number): Promise<void> {
  if (count <= 0) return;

  const now = Date.now();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const last = raw ? Number(raw) : 0;
    if (now - last < COOLDOWN_DAYS * 24 * 60 * 60 * 1000) return;
  } catch {
    // sem o registro, segue e notifica.
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Fiado esperando 💰",
      body:
        count === 1
          ? `Você tem 1 venda fiada há mais de ${MIN_AGE_DAYS} dias (${formatCurrency(total)}). Que tal lembrar o cliente?`
          : `Você tem ${count} vendas fiadas há mais de ${MIN_AGE_DAYS} dias (${formatCurrency(total)}). Que tal lembrar os clientes?`,
      data: { type: NOTIFICATION_TYPES.PENDING_SALES },
    },
    trigger: null,
  });
  await AsyncStorage.setItem(KEY, String(now));
}

/**
 * Notificação local quando há fiado em aberto há mais de uma semana,
 * com cooldown de alguns dias para não virar incômodo.
 */
export function useFiadoNotifier(): void {
  const { data } = useSales({ status: "pending" });

  useEffect(() => {
    if (!data) return;
    const { count, total } = oldFiadoSummary(data.items, new Date(), MIN_AGE_DAYS);
    void maybeNotify(count, total);
  }, [data]);
}
