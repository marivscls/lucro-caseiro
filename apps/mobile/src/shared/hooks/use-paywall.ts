import { create } from "zustand";

interface PaywallState {
  visible: boolean;
  resource: string | null;
  show: (resource: string) => void;
  hide: () => void;
}

export const usePaywall = create<PaywallState>((set) => ({
  visible: false,
  resource: null,
  show: (resource) => set({ visible: true, resource }),
  hide: () => set({ visible: false, resource: null }),
}));
