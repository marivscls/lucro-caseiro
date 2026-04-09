import { router } from "expo-router";
import type { NotificationResponse } from "expo-notifications";

export const NOTIFICATION_TYPES = {
  PENDING_SALES: "PENDING_SALES",
  CLIENT_BIRTHDAY: "CLIENT_BIRTHDAY",
  LOW_STOCK: "LOW_STOCK",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Dados extras que acompanham cada tipo de notificacao */
export type NotificationData =
  | { type: typeof NOTIFICATION_TYPES.PENDING_SALES; saleId?: string }
  | { type: typeof NOTIFICATION_TYPES.CLIENT_BIRTHDAY; clientId?: string }
  | { type: typeof NOTIFICATION_TYPES.LOW_STOCK; productId?: string };

/**
 * Roteia o usuario para a tela correta ao tocar na notificacao.
 */
export function handleNotificationResponse(response: NotificationResponse): void {
  const data = response.notification.request.content.data as NotificationData | undefined;

  if (!data?.type) return;

  switch (data.type) {
    case NOTIFICATION_TYPES.PENDING_SALES:
      router.push("/tabs");
      break;
    case NOTIFICATION_TYPES.CLIENT_BIRTHDAY:
      router.push("/tabs/clients");
      break;
    case NOTIFICATION_TYPES.LOW_STOCK:
      router.push("/products");
      break;
  }
}
