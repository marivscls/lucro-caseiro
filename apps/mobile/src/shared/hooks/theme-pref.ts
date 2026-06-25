import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ThemeMode } from "@lucro-caseiro/ui";
import { create } from "zustand";

const STORAGE_KEY = "themeMode";

interface ThemePrefState {
  /** `null` = usuário ainda não escolheu (segue o tema do sistema). */
  mode: ThemeMode | null;
  loaded: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Tema escolhido pelo usuário, persistido no aparelho. Default = `null` (segue o
 * sistema). O ThemeProvider é montado com o valor resolvido após hydrate(), e cada
 * troca em Configurações persiste aqui via onModeChange.
 */
export const useThemePref = create<ThemePrefState>((set) => ({
  mode: null,
  loaded: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      set({ mode: raw === "light" || raw === "dark" ? raw : null, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  setMode: (mode) => {
    set({ mode });
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  },
}));
