import { useAuth } from "../../shared/hooks/use-auth";
import { useGuidanceStore } from "../../shared/guidance/guidance-store";
import { completedAreas } from "../../shared/guidance/completion";
import type {
  AnalyticsActionName,
  ProductAnalyticsEvent,
} from "@lucro-caseiro/contracts";

import { recordProductAnalyticsEvents } from "./api";
import { getOrCreateInstallationId } from "./installation";
import { appMetadata } from "./metadata";

export async function trackAnalyticsEvent(
  event: ProductAnalyticsEvent,
  token: string | null,
): Promise<void> {
  try {
    const installationId = await getOrCreateInstallationId();
    await recordProductAnalyticsEvents(
      { installationId, ...appMetadata(), events: [event] },
      token,
    );
  } catch (error) {
    if (__DEV__) console.warn("[analytics] evento nao registrado", error);
  }
}

export function trackAnalyticsAction(
  name: AnalyticsActionName,
  token: string | null,
): Promise<void> {
  const session = useAuth.getState();
  if (token && token === session.token && session.userId) {
    void useGuidanceStore
      .getState()
      .load(session.userId)
      .then(() => {
        if (useAuth.getState().userId !== session.userId || !session.userId) return;
        for (const area of completedAreas(name)) {
          const store = useGuidanceStore.getState();
          if (!store.accounts[session.userId]?.[area]?.completed) {
            store.mark(session.userId, area, "completed");
            void trackAnalyticsEvent(
              { type: "action", name: `guidance_${area}_task_completed` },
              token,
            );
          }
        }
      })
      .catch(() => undefined);
  }
  return trackAnalyticsEvent({ type: "action", name }, token);
}
