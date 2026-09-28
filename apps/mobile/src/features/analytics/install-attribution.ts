import { getInstallReferrerAsync } from "expo-application";
import { Platform } from "react-native";
import { createAttributionReader } from "./attribution";

const readAndroidAttribution = createAttributionReader(getInstallReferrerAsync);

export async function getInstallAttribution() {
  return Platform.OS === "android" ? readAndroidAttribution() : undefined;
}
