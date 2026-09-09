import { getActiveBrand } from "@lucro-caseiro/brands";
import { BrowserNotifications } from "./browser-notifications";

export const BROWSER_PUSH_OWNER = "browser-push-owner";
export function browserPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function browserPushRequest(
  path: string,
  token: string,
  method = "GET",
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"}/api/v1/notifications/web${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-brand": getActiveBrand().id,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (path === "/config" && response.status === 404) {
      throw new Error("O servidor ainda não recebeu a atualização de notificações.");
    }
    throw new Error(
      error.message || "Não foi possível salvar as notificações. Tente novamente.",
    );
  }
  return response.status === 204 ? undefined : response.json();
}

export const browserPush = new BrowserNotifications({
  supported: browserPushSupported,
  permission: () => Notification.permission,
  requestPermission: () => Notification.requestPermission(),
  // Never await serviceWorker.ready indefinitely (development has no worker).
  registration: () => navigator.serviceWorker.getRegistration("/"),
  request: browserPushRequest,
});

export async function stopBrowserPush(token: string): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BROWSER_PUSH_OWNER);
  await browserPush.disable(token);
}
