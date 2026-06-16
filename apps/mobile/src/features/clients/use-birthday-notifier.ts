import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { useNotificationEnabled } from "../../shared/hooks/notification-prefs";
import { useClients } from "./hooks";

// Avisa no máximo uma vez por dia (guarda a data YYYY-MM-DD do último aviso).
const KEY = "birthdayNotifiedOn";

function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** O aniversário (ISO `YYYY-MM-DD`) cai no mesmo dia/mês de `today`? Pura p/ teste. */
export function isBirthdayToday(birthday: string | null, today: Date): boolean {
  if (!birthday) return false;
  const parts = birthday.split("T")[0].split("-");
  if (parts.length < 3) return false;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return month === today.getMonth() + 1 && day === today.getDate();
}

async function maybeNotify(names: string[], today: Date): Promise<void> {
  if (names.length === 0) return;
  const tk = dayKey(today);
  try {
    const last = await AsyncStorage.getItem(KEY);
    if (last === tk) return; // já avisou hoje
  } catch {
    // sem registro: segue e avisa.
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Aniversário hoje 🎉",
      body:
        names.length === 1
          ? `Hoje é aniversário de ${names[0]}. Que tal mandar um oi?`
          : `${names.length} clientes fazem aniversário hoje. Que tal parabenizar?`,
      data: { type: NOTIFICATION_TYPES.CLIENT_BIRTHDAY },
    },
    trigger: null,
  });

  try {
    await AsyncStorage.setItem(KEY, tk);
  } catch {
    // ignora falha de persistência.
  }
}

/**
 * Notifica quando um cliente faz aniversário hoje — recurso **Premium**.
 */
export function useBirthdayNotifier(isPremium: boolean): void {
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.CLIENT_BIRTHDAY);
  const { data } = useClients();

  useEffect(() => {
    if (!isPremium || !enabled || !data) return;
    const today = new Date();
    const names = data.items
      .filter((c) => isBirthdayToday(c.birthday, today))
      .map((c) => c.name);
    void maybeNotify(names, today);
  }, [data, enabled, isPremium]);
}
