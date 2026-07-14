import { asyncStorage } from "../../shared/utils/async-storage";

const INSTALLATION_ID_KEY = "analytics:installation-id";
let defaultInstallationId: Promise<string> | null = null;

export interface InstallationStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function createInstallationId(random: () => number = Math.random): string {
  const hex = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return hex.replace(/[xy]/g, (token) => {
    const value = Math.floor(random() * 16);
    const nibble = token === "x" ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}

export async function getOrCreateInstallationId(
  storage: InstallationStorage = asyncStorage,
): Promise<string> {
  if (storage === asyncStorage) {
    defaultInstallationId ??= resolveInstallationId(storage);
    return defaultInstallationId;
  }

  return resolveInstallationId(storage);
}

async function resolveInstallationId(storage: InstallationStorage): Promise<string> {
  const existing = await storage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;

  const created = createInstallationId();
  await storage.setItem(INSTALLATION_ID_KEY, created);
  return created;
}
