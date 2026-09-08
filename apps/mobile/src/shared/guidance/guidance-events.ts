import type { GuidanceArea, GuidanceEvent } from "@lucro-caseiro/contracts";
import { trackAnalyticsAction } from "../../features/analytics/tracker";
import { useAuth } from "../hooks/use-auth";
export function guidanceEvent(
  area: GuidanceArea,
  event: GuidanceEvent,
  userId: string,
): void {
  const session = useAuth.getState();
  if (session.userId !== userId) return;
  void trackAnalyticsAction(`guidance_${area}_${event}`, session.token);
}
