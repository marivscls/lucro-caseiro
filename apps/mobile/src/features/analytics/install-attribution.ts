import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
import { createAttributionReader } from "./attribution";

// Builds antigos do app não têm o módulo nativo: sem ele, só não há atribuição.
const hasExpoApplication = requireOptionalNativeModule("ExpoApplication") != null;

type ExpoApplication = typeof import("expo-application");

function loadExpoApplication(): ExpoApplication {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carregado só quando o módulo nativo existe
  return require("expo-application") as ExpoApplication;
}

const readAndroidAttribution = createAttributionReader(() =>
  loadExpoApplication().getInstallReferrerAsync(),
);

export async function getInstallAttribution() {
  return Platform.OS === "android" && hasExpoApplication
    ? readAndroidAttribution()
    : undefined;
}
