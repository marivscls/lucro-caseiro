import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "./use-auth";
import { handleNotificationResponse } from "./notification-types";

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
async function ensureNotificationPermissionsAsync(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (String(existingStatus) !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotifications() {
  const { isAuthenticated } = useAuth();

  const notificationListener = useRef<{ remove(): void } | null>(null);
  const responseListener = useRef<{ remove(): void } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;

    void ensureNotificationPermissionsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification received while app is in foreground — no-op for now
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);
}
