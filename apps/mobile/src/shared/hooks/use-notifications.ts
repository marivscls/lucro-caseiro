import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { create } from "zustand";

import { apiClient } from "../utils/api-client";
import { useAuth } from "./use-auth";
import { handleNotificationResponse } from "./notification-types";

// ---------------------------------------------------------------------------
// Global notification handler — shows alerts even when app is in foreground
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Registration helper
// ---------------------------------------------------------------------------
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (String(existingStatus) !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (String(finalStatus) !== "granted") return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// ---------------------------------------------------------------------------
// Zustand store for the push token
// ---------------------------------------------------------------------------
interface NotificationState {
  expoPushToken: string | null;
  setExpoPushToken: (token: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  expoPushToken: null,
  setExpoPushToken: (token) => set({ expoPushToken: token }),
}));

// ---------------------------------------------------------------------------
// Save push token to backend
// ---------------------------------------------------------------------------
async function savePushTokenToBackend(
  pushToken: string,
  authToken: string,
): Promise<void> {
  try {
    await apiClient("/users/push-token", {
      method: "POST",
      body: { pushToken },
      token: authToken,
    });
  } catch {
    // Silently fail — the token will be retried on next app launch
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotifications() {
  const { token: authToken, isAuthenticated } = useAuth();
  const { expoPushToken, setExpoPushToken } = useNotificationStore();

  const notificationListener = useRef<{ remove(): void } | null>(null);
  const responseListener = useRef<{ remove(): void } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    void registerForPushNotificationsAsync().then((pushToken) => {
      if (pushToken) {
        setExpoPushToken(pushToken);

        if (authToken) {
          void savePushTokenToBackend(pushToken, authToken);
        }
      }
    });

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
  }, [isAuthenticated, authToken]);

  return { pushToken: expoPushToken, expoPushToken };
}
