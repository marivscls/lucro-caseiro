import type { LimitResource } from "../../features/subscription/limit-copy";
import { getLimitUsage, isLimitBlocked } from "../../features/subscription/limits";
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
      void trackAnalyticsAction("plan_limit_reached", useAuth.getState().token);
      showPaywall(resource);
      return true;
    }
    return false;
  }

  return { isAtLimit, current, max, checkAndBlock };
}
