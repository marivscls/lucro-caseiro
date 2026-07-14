import Constants from "expo-constants";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { useAuth } from "../../shared/hooks/use-auth";
import { recordAppOpen } from "./api";
import { getOrCreateInstallationId } from "./installation";

function appMetadata() {
  const config = Constants.expoConfig;
  let build: number | string | undefined;
  let platform: "android" | "ios" | "web" = "android";

  if (Platform.OS === "android") build = config?.android?.versionCode;
  if (Platform.OS === "ios") {
    platform = "ios";
    build = config?.ios?.buildNumber;
  }
  if (Platform.OS === "web") platform = "web";

  return {
    platform,
    appVersion: config?.version ?? "unknown",
    appBuild: build == null ? undefined : String(build),
  } as const;
}

export function useAppMetrics(): void {
  const { isLoading, token, userId } = useAuth();
  const latestToken = useRef(token);
  const lastIdentity = useRef<string | null>(null);
  latestToken.current = token;

  const sendOpen = useCallback(async () => {
    try {
      const installationId = await getOrCreateInstallationId();
      await recordAppOpen({ installationId, ...appMetadata() }, latestToken.current);
    } catch (error) {
      if (__DEV__) console.warn("[analytics] abertura não registrada", error);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const identity = userId ?? "anonymous";
    if (lastIdentity.current === identity) return;
    lastIdentity.current = identity;
    void sendOpen();
  }, [isLoading, sendOpen, userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sendOpen();
    });
    return () => subscription.remove();
  }, [sendOpen]);
}
