import type { AnalyticsAcquisition } from "@lucro-caseiro/contracts";

import { parseAcquisition } from "./acquisition-parse";

// Capturado quando o bundle carrega, antes de o roteador redirecionar e limpar a query.
const launch =
  typeof window === "undefined"
    ? null
    : {
        search: window.location.search,
        referrer: typeof document === "undefined" ? "" : document.referrer,
        host: window.location.hostname,
      };

export function readLaunchAcquisition(): Promise<AnalyticsAcquisition | null> {
  return Promise.resolve(
    launch ? parseAcquisition(launch.search, launch.referrer || null, launch.host) : null,
  );
}
