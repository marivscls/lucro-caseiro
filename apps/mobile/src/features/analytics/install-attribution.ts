import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
import { createAttributionReader } from "./attribution";

// Build sem o módulo nativo (binário antigo ou dev client): importar o
// expo-application derruba o app, então só carrega quando o módulo existe.
const hasApplicationModule = requireOptionalNativeModule("ExpoApplication") != null;

const readAndroidAttribution = createAttributionReader(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const application = require("expo-application") as typeof import("expo-application");
  return application.getInstallReferrerAsync();
});

export async function getInstallAttribution() {
  if (Platform.OS !== "android" || !hasApplicationModule) return undefined;
  return readAndroidAttribution();
}
