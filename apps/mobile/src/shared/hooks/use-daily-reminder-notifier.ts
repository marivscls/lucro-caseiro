import type { DaySalesTally } from "@lucro-caseiro/contracts";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import {
  EVENING_DAYS_AHEAD,
  EVENING_ID_PREFIX,
  eveningSchedule,
} from "./evening-summary";
import { NOTIFICATION_TYPES } from "./notification-types";
import { useNotificationEnabled } from "./notification-prefs";

// Lembrete genérico antigo (gatilho diário); cancelado para não chegar em dobro.
const LEGACY_ID = "daily-reminder";

async function sync(active: boolean, today: DaySalesTally | null): Promise<void> {
  // Ligado mas sem o resumo do dia (carregando/offline): mantém o que já está agendado.
  if (active && !today) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(LEGACY_ID);
    for (let offset = 0; offset <= EVENING_DAYS_AHEAD; offset++) {
      await Notifications.cancelScheduledNotificationAsync(
        `${EVENING_ID_PREFIX}${offset}`,
      );
    }
    if (!active || !today) return;
    for (const slot of eveningSchedule(new Date(), today)) {
      await Notifications.scheduleNotificationAsync({
        identifier: slot.id,
        content: {
          ...slot.message,
          data: { type: NOTIFICATION_TYPES.DAILY_REMINDER },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: slot.at },
      });
    }
  } catch {
    // sem permissão / indisponível: ignora.
  }
}

/**
 * Resumo da noite (19h): "Hoje você vendeu R$ X" ou, sem venda, um convite para
 * anotar. Reagenda sempre que as vendas de hoje mudam. `today` nulo enquanto
 * o resumo do dia não carregou (não agenda com zero falso).
 */
export function useDailyReminderNotifier(
  canUse: boolean,
  today: DaySalesTally | null,
): void {
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.DAILY_REMINDER);
  const active = canUse && enabled;
  const count = today?.count;
  const total = today?.total;

  useEffect(() => {
    if (Platform.OS === "web") return;
    void sync(
      active,
      count === undefined || total === undefined ? null : { count, total },
    );
  }, [active, count, total]);
}
