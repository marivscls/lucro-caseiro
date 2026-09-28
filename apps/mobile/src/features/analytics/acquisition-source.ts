import type { AnalyticsAcquisition } from "@lucro-caseiro/contracts";

import { parseAcquisition } from "./acquisition-parse";

/**
 * Fallback da captura persistente usada na web. No Android, use-app-metrics lê
 * install-attribution.ts separadamente, com expo-application e nova tentativa
 * após erro/timeout, sem persistir uma leitura vazia como origem definitiva.
 */
function readNativeInstallReferrer(): Promise<string | null> {
  return Promise.resolve(null);
}

export async function readLaunchAcquisition(): Promise<AnalyticsAcquisition | null> {
  const referrer = await readNativeInstallReferrer();
  return referrer ? parseAcquisition(referrer) : null;
}
