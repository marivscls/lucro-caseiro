import Constants from "expo-constants";
import { Platform } from "react-native";

export function appMetadata() {
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
