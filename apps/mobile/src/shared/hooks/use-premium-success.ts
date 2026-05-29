import { create } from "zustand";

interface PremiumSuccessState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

// Controla a tela de comemoracao exibida quando o plano vira Premium.
export const usePremiumSuccess = create<PremiumSuccessState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
