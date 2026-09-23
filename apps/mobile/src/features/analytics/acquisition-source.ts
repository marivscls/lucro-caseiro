import type { AnalyticsAcquisition } from "@lucro-caseiro/contracts";

import { parseAcquisition } from "./acquisition-parse";

/**
 * Ponto de extensão do Android: deve devolver o Play Install Referrer bruto
 * (ex.: "utm_source=site_publico&utm_content=hero"). Ler esse valor exige um módulo
 * nativo (ex.: `getInstallReferrerAsync` do expo-application), que ainda não foi
 * aprovado como dependência; por isso retorna null e a origem fica vazia no nativo.
 */
function readNativeInstallReferrer(): Promise<string | null> {
  return Promise.resolve(null);
}

export async function readLaunchAcquisition(): Promise<AnalyticsAcquisition | null> {
  const referrer = await readNativeInstallReferrer();
  return referrer ? parseAcquisition(referrer) : null;
}
