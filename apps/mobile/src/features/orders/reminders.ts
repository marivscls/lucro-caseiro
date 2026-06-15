import type { Order } from "@lucro-caseiro/contracts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { formatDateBR } from "./domain";

// Mapa orderId -> id da notificação agendada, p/ poder cancelar/reagendar.
const STORE_KEY = "orderReminderIds";
const REMIND_HOUR = 9; // véspera às 9h

async function getMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function setMap(map: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    // best-effort; sem o mapa, o lembrete só não será cancelável.
  }
}

/** Cancela o lembrete agendado de uma encomenda (se houver). */
export async function cancelOrderReminder(orderId: string): Promise<void> {
  const map = await getMap();
  const notificationId = map[orderId];
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignora: pode já ter disparado/expirado.
  }
  delete map[orderId];
  await setMap(map);
}

/**
 * Momento do lembrete: véspera da entrega às 9h. Null se a data for inválida
 * ou se o instante já passou em relação a `now`. Função pura (testável).
 */
export function reminderInstant(deliveryDate: string, now: Date): Date | null {
  const [year, month, day] = deliveryDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const when = new Date(year, month - 1, day, REMIND_HOUR, 0, 0);
  when.setDate(when.getDate() - 1);
  return when.getTime() > now.getTime() ? when : null;
}

/**
 * Regra pura: deve agendar lembrete? Não para encomendas finalizadas
 * (entregue/cancelada) nem quando não há instante futuro válido.
 */
export function shouldScheduleReminder(
  order: Pick<Order, "status" | "deliveryDate">,
  now: Date,
): boolean {
  if (order.status === "done" || order.status === "cancelled") return false;
  return reminderInstant(order.deliveryDate, now) !== null;
}

/**
 * (Re)agenda o lembrete local de uma encomenda. Cancela o anterior; não agenda
 * para encomendas finalizadas (entregue/cancelada) nem para datas no passado.
 */
export async function scheduleOrderReminder(order: Order): Promise<void> {
  await cancelOrderReminder(order.id);

  const now = new Date();
  if (!shouldScheduleReminder(order, now)) return;
  const when = reminderInstant(order.deliveryDate, now);
  if (!when) return;

  const time = order.deliveryTime ? ` às ${order.deliveryTime}` : "";
  const who = order.clientName ? ` · ${order.clientName}` : "";

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Entrega amanhã 📦",
        body: `${order.title}${who} — ${formatDateBR(order.deliveryDate)}${time}`,
        data: { type: NOTIFICATION_TYPES.DELIVERY },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
    const map = await getMap();
    map[order.id] = notificationId;
    await setMap(map);
  } catch {
    // sem permissão de notificação ou indisponível — segue sem agendar.
  }
}
