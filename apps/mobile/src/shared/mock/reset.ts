import { clearDemoDataCache } from "./db";
import { clearMockMemory } from "./storage";

const RESET_PARAM = "reset";

/** `?reset=1` (ou `true`) pede para recomeçar a demonstração do zero. */
export function isResetRequested(search: string): boolean {
  const value = new URLSearchParams(search).get(RESET_PARAM);
  return value === "1" || value === "true";
}

/** Mesma URL, sem o parâmetro de reset (para recarregar sem entrar em loop). */
export function urlWithoutReset(href: string): string {
  const url = new URL(href);
  url.searchParams.delete(RESET_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

interface ResetEnvironment {
  location: { href: string; search: string; replace: (url: string) => void };
  storages: (Storage | null | undefined)[];
  onLeave: (listener: () => void) => void;
}

function clearAll(storages: ResetEnvironment["storages"]): void {
  for (const storage of storages) {
    try {
      storage?.clear();
    } catch {
      // Storage bloqueado: não há o que limpar.
    }
  }
  clearMockMemory();
  clearDemoDataCache();
}

/**
 * Apaga tudo o que o app guarda neste navegador (AsyncStorage no web é o
 * localStorage) e o estado da API simulada, e recarrega sem `?reset=1`.
 * Limpa de novo ao sair da página, para descartar gravações tardias.
 */
export function resetDemoIfRequested(env: ResetEnvironment): boolean {
  if (!isResetRequested(env.location.search)) return false;
  clearAll(env.storages);
  env.onLeave(() => clearAll(env.storages));
  env.location.replace(urlWithoutReset(env.location.href));
  return true;
}

function safeStorage(read: () => Storage): Storage | null {
  try {
    return read();
  } catch {
    return null;
  }
}

export function resetBrowserDemoIfRequested(): boolean {
  if (typeof window === "undefined" || !window.location) return false;
  return resetDemoIfRequested({
    location: window.location,
    storages: [
      safeStorage(() => window.localStorage),
      safeStorage(() => window.sessionStorage),
    ],
    onLeave: (listener) => window.addEventListener("pagehide", listener),
  });
}
