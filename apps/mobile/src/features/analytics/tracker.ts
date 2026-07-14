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
  return trackAnalyticsEvent({ type: "action", name }, token);
}
