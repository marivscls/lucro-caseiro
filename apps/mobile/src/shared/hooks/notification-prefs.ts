import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { type NotificationType } from "./notification-types";

const STORAGE_KEY = "notificationPrefs";

type Prefs = Partial<Record<NotificationType, boolean>>;

interface NotificationPrefsState {
  prefs: Prefs;
  loaded: boolean;
  hydrate: () => Promise<void>;
  setPref: (type: NotificationType, value: boolean) => void;
}

/**
 * Preferências de notificação por tipo, persistidas no aparelho (as notificações
 * são locais). Default = ligado (ausência da chave = `true`); os notificadores
 * consultam isto antes de agendar/disparar.
 */
export const useNotificationPrefs = create<NotificationPrefsState>((set, get) => ({
  prefs: {},
  loaded: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      set({ prefs: raw ? (JSON.parse(raw) as Prefs) : {}, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  setPref: (type, value) => {
    const prefs = { ...get().prefs, [type]: value };
    set({ prefs });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  },
}));

/** `true` quando o tipo está ligado (default ligado). Função pura p/ testes. */
export function isPrefEnabled(prefs: Prefs, type: NotificationType): boolean {
  return prefs[type] !== false;
}

/** Selector reativo: a preferência de um tipo está ligada? */
export function useNotificationEnabled(type: NotificationType): boolean {
  return useNotificationPrefs((s) => isPrefEnabled(s.prefs, type));
}
