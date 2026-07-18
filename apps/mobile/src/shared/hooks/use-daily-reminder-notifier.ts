import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { NOTIFICATION_TYPES } from "./notification-types";
import { useNotificationEnabled } from "./notification-prefs";

const ID = "daily-reminder";

async function sync(active: boolean): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
    if (!active) return;
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: {
        title: "Fechou o dia? 📝",
        body: "Registre as vendas de hoje pra não perder nada de vista.",
        data: { type: NOTIFICATION_TYPES.DAILY_REMINDER },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });
  } catch {
    // sem permissão / indisponível: ignora.
  }
}

/**
 * Lembrete diário (19h) pra registrar as vendas — recurso **Premium**.
 * Agenda quando ligado + premium; cancela caso contrário.
 */
export function useDailyReminderNotifier(isPremium: boolean): void {
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.DAILY_REMINDER);
  const active = isPremium && enabled;

  useEffect(() => {
    if (Platform.OS === "web") return;
    void sync(active);
  }, [active]);
}
