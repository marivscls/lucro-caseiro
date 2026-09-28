import { MEI_DAS_REMINDER_DAY } from "@lucro-caseiro/contracts";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";

const ID = "mei-das-reminder";

/** Lembrete do DAS só existe no celular (no navegador não há agendamento). */
export const dasReminderSupported = Platform.OS !== "web";

export async function isDasReminderOn(): Promise<boolean> {
  if (!dasReminderSupported) return false;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((item) => item.identifier === ID);
  } catch {
    return false;
  }
}

/**
 * Liga ou desliga o aviso mensal (dia 15, 9h) de que o DAS vence no dia 20.
 * Devolve o estado final: false quando a pessoa não deu permissão.
 */
export async function setDasReminder(on: boolean): Promise<boolean> {
  if (!dasReminderSupported) return false;
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
    if (!on) return false;
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return false;
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: {
        title: "DAS do MEI vence dia 20",
        body: "Separe o valor e pague até o dia 20 para não pagar multa.",
        data: { type: NOTIFICATION_TYPES.MEI_DAS },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: MEI_DAS_REMINDER_DAY,
        hour: 9,
        minute: 0,
      },
    });
    return true;
  } catch {
    return false;
  }
}
