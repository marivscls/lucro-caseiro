type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();
let nativeStorage: AsyncStorageLike | null | undefined;

function resolveNativeStorage(): AsyncStorageLike | null {
  if (nativeStorage !== undefined) return nativeStorage;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy native load lets the app open even when the dev build is stale.
    const mod = require("@react-native-async-storage/async-storage") as {
      default?: AsyncStorageLike;
      getItem?: unknown;
      setItem?: unknown;
      removeItem?: unknown;
    };
    const storage =
      mod.default ??
      (typeof mod.getItem === "function" &&
      typeof mod.setItem === "function" &&
      typeof mod.removeItem === "function"
        ? (mod as AsyncStorageLike)
        : null);
    nativeStorage = storage;
  } catch {
    nativeStorage = null;
  }

  return nativeStorage ?? null;
}

async function withFallback<T>(
  run: (storage: AsyncStorageLike) => Promise<T>,
  fallback: () => T,
): Promise<T> {
  const storage = resolveNativeStorage();
  if (!storage) return fallback();

  try {
    return await run(storage);
  } catch {
    nativeStorage = null;
    return fallback();
  }
}

export const asyncStorage: AsyncStorageLike = {
  getItem: (key) =>
    withFallback(
      (storage) => storage.getItem(key),
      () => memory.get(key) ?? null,
    ),
  setItem: (key, value) =>
    withFallback(
      (storage) => storage.setItem(key, value),
      () => {
        memory.set(key, value);
      },
    ),
  removeItem: (key) =>
    withFallback(
      (storage) => storage.removeItem(key),
      () => {
        memory.delete(key);
      },
    ),
};
