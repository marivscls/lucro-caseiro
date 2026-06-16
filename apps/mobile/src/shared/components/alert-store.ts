import { create } from "zustand";

export interface AppAlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export interface AppAlertOptions {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
}

interface AppAlertState {
  options: AppAlertOptions | null;
  show: (options: AppAlertOptions) => void;
  hide: () => void;
}

export const useAppAlert = create<AppAlertState>((set) => ({
  options: null,
  show: (options) => set({ options }),
  hide: () => set({ options: null }),
}));

/** Abre o popup do app a partir de qualquer lugar (inclusive fora do React). */
export function showAlert(options: AppAlertOptions) {
  useAppAlert.getState().show(options);
}
