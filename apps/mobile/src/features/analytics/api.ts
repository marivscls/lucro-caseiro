import { apiClient } from "../../shared/utils/api-client";

export interface AppOpenPayload {
  installationId: string;
  platform: "android" | "ios" | "web";
  appVersion: string;
  appBuild?: string;
}

export async function recordAppOpen(
  payload: AppOpenPayload,
  token: string | null,
): Promise<void> {
  await apiClient(token ? "/api/v1/analytics/identify" : "/api/v1/analytics/open", {
    method: "POST",
    body: payload,
    token: token ?? undefined,
  });
}
