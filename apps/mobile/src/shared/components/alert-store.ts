import { create } from "zustand";
import { userErrorMessage } from "@lucro-caseiro/contracts";

export interface AppAlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export interface AppAlertOptions {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
  variant?: "default" | "account-created" | "sale-success";
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
  const isError = /^erro(?:\b|$)/i.test(options.title);
  useAppAlert.getState().show(
    isError
      ? {
          ...options,
          title: options.title === "Erro" ? "Não foi possível concluir" : options.title,
          message: userErrorMessage(options.message),
        }
      : options,
  );
}
