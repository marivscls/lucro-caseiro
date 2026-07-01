import type { PaidPlan } from "@lucro-caseiro/contracts";
import { create } from "zustand";

interface PaywallState {
  visible: boolean;
  resource: string | null;
  recommendedTier: PaidPlan | null;
  show: (resource: string, recommendedTier?: PaidPlan) => void;
  hide: () => void;
}

export const usePaywall = create<PaywallState>((set) => ({
  visible: false,
  resource: null,
  recommendedTier: null,
  show: (resource, recommendedTier = undefined) =>
    set({ visible: true, resource, recommendedTier: recommendedTier ?? null }),
  hide: () => set({ visible: false, resource: null, recommendedTier: null }),
}));
