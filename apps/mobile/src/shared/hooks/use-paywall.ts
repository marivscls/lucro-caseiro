import type { PaidPlan } from "@lucro-caseiro/contracts";
import { create } from "zustand";

import { currentAnalyticsScreen } from "../../features/analytics/screen-tracking";
import { trackAnalyticsAction } from "../../features/analytics/tracker";
import { useAuth } from "./use-auth";

export type PaywallTrigger = "feature" | "limit";

interface PaywallState {
  visible: boolean;
  resource: string | null;
  recommendedTier: PaidPlan | null;
  /** `trigger`: "limit" quando o plano bloqueou um cadastro; "feature" para recurso pago. */
  show: (resource: string, recommendedTier?: PaidPlan, trigger?: PaywallTrigger) => void;
  hide: () => void;
}

export const usePaywall = create<PaywallState>((set) => ({
  visible: false,
  resource: null,
  recommendedTier: null,
  show: (resource, recommendedTier = undefined, trigger = "feature") => {
    const screen = currentAnalyticsScreen();
    void trackAnalyticsAction("paid_feature_requested", useAuth.getState().token, {
      feature: resource,
      trigger,
      ...(screen ? { screen } : {}),
      ...(recommendedTier ? { plan: recommendedTier } : {}),
    });
    set({ visible: true, resource, recommendedTier: recommendedTier ?? null });
  },
  hide: () => set({ visible: false, resource: null, recommendedTier: null }),
}));
