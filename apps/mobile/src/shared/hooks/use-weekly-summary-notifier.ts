import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { NOTIFICATION_TYPES } from "./notification-types";
import { useNotificationEnabled } from "./notification-prefs";

const ID = "weekly-summary";

async function sync(active: boolean): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
    if (!active) return;
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: {
        title: "Resumo da semana 📊",
        body: "Veja como foi sua semana: faturamento, lucro e os campeões de venda.",
        data: { type: NOTIFICATION_TYPES.WEEKLY_SUMMARY },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2, // segunda-feira (1 = domingo)
        hour: 9,
        minute: 0,
      },
    });
  } catch {
    // sem permissão / indisponível: ignora.
  }
}

/**
 * Resumo semanal (segunda, 9h) — recurso **Premium**.
 * Agenda quando ligado + premium; cancela caso contrário.
 */
export function useWeeklySummaryNotifier(isPremium: boolean): void {
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.WEEKLY_SUMMARY);
  const active = isPremium && enabled;

  useEffect(() => {
    if (Platform.OS === "web") return;
    void sync(active);
  }, [active]);
}
