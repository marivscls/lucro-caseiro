// Persistência do modo demonstração. No navegador usa o localStorage da própria
// origem (a demo é servida na raiz do seu domínio); fora dele, só memória.
export const MOCK_STORAGE_PREFIX = "lucro-demo:";

const memory = new Map<string, string>();

function webStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readMockJson<T>(key: string): T | null {
  const fullKey = MOCK_STORAGE_PREFIX + key;
  let raw: string | null = memory.get(fullKey) ?? null;
  try {
    raw = webStorage()?.getItem(fullKey) ?? raw;
  } catch {
    // Sem storage (aba privada, bloqueio): segue com a memória.
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeMockJson(key: string, value: unknown): void {
  const fullKey = MOCK_STORAGE_PREFIX + key;
  const raw = JSON.stringify(value);
  memory.set(fullKey, raw);
  try {
    webStorage()?.setItem(fullKey, raw);
  } catch {
    // Cota cheia ou storage bloqueado: a memória mantém a sessão atual.
  }
}

export function clearMockMemory(): void {
  memory.clear();
}

/** UUID v4 sem depender de `crypto.randomUUID` (ausente em alguns runtimes). */
export function mockUuid(random: () => number = Math.random): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(random() * 16);
    return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
}
