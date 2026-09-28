import type { LimitResource } from "../../features/subscription/limit-copy";
import { getLimitUsage, isLimitBlocked } from "../../features/subscription/limits";
import { currentAnalyticsScreen } from "../../features/analytics/screen-tracking";
import { trackAnalyticsAction } from "../../features/analytics/tracker";
import { useAuth } from "./use-auth";
import { useLimits, useProfile } from "../../features/subscription/hooks";
import { usePaywall } from "./use-paywall";

export function useLimitCheck(resource: LimitResource) {
  const { data: limits } = useLimits();
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((s) => s.show);
  const { current, max } = getLimitUsage(limits, resource);
  const isAtLimit = isLimitBlocked(limits, profile, resource);

  function checkAndBlock(): boolean {
    if (isAtLimit) {
      const screen = currentAnalyticsScreen();
      void trackAnalyticsAction("plan_limit_reached", useAuth.getState().token, {
        resource,
        ...(screen ? { screen } : {}),
      });
      showPaywall(resource, undefined, "limit");
      return true;
    }
    return false;
  }

  return { isAtLimit, current, max, checkAndBlock };
}
