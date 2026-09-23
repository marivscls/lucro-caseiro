import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { asyncStorage } from "../utils/async-storage";

interface NotificationAskState {
  /** Já pode pedir permissão de notificação (depois da primeira venda). */
  ready: boolean;
  markReady: () => void;
}

/**
 * Pedir permissão logo depois do login assusta quem acabou de chegar. O pedido
 * só aparece depois da primeira venda, quando os lembretes fazem sentido.
 */
export const useNotificationAsk = create<NotificationAskState>()(
  persist(
    (set) => ({
      ready: false,
      markReady: () => set({ ready: true }),
    }),
    {
      name: "notification-ask",
      storage: createJSONStorage(() => asyncStorage),
      partialize: (state) => ({ ready: state.ready }),
    },
  ),
);
