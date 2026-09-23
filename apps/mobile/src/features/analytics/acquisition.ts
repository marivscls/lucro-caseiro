import {
  ANALYTICS_ACQUISITION_FIELDS,
  type AnalyticsAcquisition,
} from "@lucro-caseiro/contracts";

import { asyncStorage } from "../../shared/utils/async-storage";
import { readLaunchAcquisition } from "./acquisition-source";
import type { InstallationStorage } from "./installation";

const ACQUISITION_KEY = "analytics:acquisition";
let defaultAcquisition: Promise<AnalyticsAcquisition | undefined> | null = null;

function parseStored(stored: string): AnalyticsAcquisition | undefined {
  try {
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== "object") return undefined;
    const acquisition: AnalyticsAcquisition = {};
    for (const field of ANALYTICS_ACQUISITION_FIELDS) {
      const item = (value as Record<string, unknown>)[field];
      if (typeof item === "string" && item) acquisition[field] = item;
    }
    return Object.keys(acquisition).length > 0 ? acquisition : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Origem capturada uma única vez por instalação. A primeira leitura persiste o resultado
 * (inclusive "sem origem"), para que aberturas futuras não troquem a origem original.
 */
export function getInstallationAcquisition(
  storage: InstallationStorage = asyncStorage,
  read: () => Promise<AnalyticsAcquisition | null> = readLaunchAcquisition,
): Promise<AnalyticsAcquisition | undefined> {
  if (storage === asyncStorage && read === readLaunchAcquisition) {
    defaultAcquisition ??= resolveAcquisition(storage, read);
    return defaultAcquisition;
  }
  return resolveAcquisition(storage, read);
}

async function resolveAcquisition(
  storage: InstallationStorage,
  read: () => Promise<AnalyticsAcquisition | null>,
): Promise<AnalyticsAcquisition | undefined> {
  const stored = await storage.getItem(ACQUISITION_KEY);
  if (stored !== null) return parseStored(stored);

  const captured = await read().catch(() => null);
  await storage.setItem(ACQUISITION_KEY, JSON.stringify(captured ?? {}));
  return captured ?? undefined;
}
