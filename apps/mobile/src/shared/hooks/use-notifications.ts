import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "./use-auth";
import { handleNotificationResponse } from "./notification-types";
import { registerPushToken, unregisterPushToken } from "./push-token-api";

// ---------------------------------------------------------------------------
// Global notification handler — shows alerts even when app is in foreground
// ---------------------------------------------------------------------------
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
  });
}

// ---------------------------------------------------------------------------
// Permission helper — ensures local notifications can be shown/scheduled
// ---------------------------------------------------------------------------
async function ensureNotificationPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (String(existingStatus) === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return String(status) === "granted";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotifications() {
  const { isAuthenticated, userId } = useAuth();

  const notificationListener = useRef<{ remove(): void } | null>(null);
  const responseListener = useRef<{ remove(): void } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;

    let active = true;
    let registeredToken: string | null = null;
    let registrationAccessToken: string | null = null;

    void (async () => {
      try {
        const allowed = await ensureNotificationPermissionsAsync();
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const accessToken = useAuth.getState().token;
        if (!allowed || !projectId || !accessToken) return;
        if (Platform.OS !== "android" && Platform.OS !== "ios") return;

        const result = await Notifications.getExpoPushTokenAsync({ projectId });
        await registerPushToken(result.data, Platform.OS, accessToken);

        if (!active) {
          await unregisterPushToken(result.data, accessToken);
          return;
        }
        registeredToken = result.data;
        registrationAccessToken = accessToken;
      } catch (error) {
        if (__DEV__) console.warn("[notifications] push token nao registrado", error);
      }
    })();

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      handleNotificationResponse(lastResponse);
      Notifications.clearLastNotificationResponse();
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification received while app is in foreground — no-op for now
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      active = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (registeredToken && registrationAccessToken) {
        void unregisterPushToken(registeredToken, registrationAccessToken).catch(
          (error) => {
            if (__DEV__) console.warn("[notifications] push token nao removido", error);
          },
        );
      }
    };
  }, [isAuthenticated, userId]);
}
