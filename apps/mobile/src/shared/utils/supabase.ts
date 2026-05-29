import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// O SecureStore tem limite de ~2048 bytes por valor, e o token de sessao do
// Supabase pode passar disso. Por isso quebramos valores grandes em pedacos:
// a chave principal guarda um marcador com a contagem e cada pedaco vai em
// `${key}.${i}`. Tokens sao ASCII (JWT/base64), entao length == bytes.
const CHUNK_SIZE = 1800;
const CHUNK_PREFIX = "__chunked__:";

const webStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

async function secureRemove(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (head !== null && head.startsWith(CHUNK_PREFIX)) {
    const count = parseInt(head.slice(CHUNK_PREFIX.length), 10) || 0;
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
  }
  await SecureStore.deleteItemAsync(key);
}

async function secureGet(key: string): Promise<string | null> {
  const head = await SecureStore.getItemAsync(key);
  if (head === null) return null;
  if (!head.startsWith(CHUNK_PREFIX)) return head;

  const count = parseInt(head.slice(CHUNK_PREFIX.length), 10) || 0;
  let value = "";
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(`${key}.${i}`);
    if (part === null) return null; // pedaco faltando -> trata como ausente
    value += part;
  }
  return value;
}

async function secureSet(key: string, value: string): Promise<void> {
  await secureRemove(key); // limpa pedacos/valor anterior

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const count = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(key, `${CHUNK_PREFIX}${count}`);
  for (let i = 0; i < count; i++) {
    await SecureStore.setItemAsync(
      `${key}.${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    );
  }
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    Platform.OS === "web" ? Promise.resolve(webStorage.getItem(key)) : secureGet(key),
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      webStorage.setItem(key, value);
      return Promise.resolve();
    }
    return secureSet(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      webStorage.removeItem(key);
      return Promise.resolve();
    }
    return secureRemove(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as unknown as Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
