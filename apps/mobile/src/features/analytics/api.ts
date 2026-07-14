import type { ProductAnalyticsDashboard } from "@lucro-caseiro/contracts";

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

export function fetchAdminAnalyticsAccess(token: string): Promise<{ allowed: boolean }> {
  return apiClient("/api/v1/analytics/admin/access", { token });
}

export function fetchAdminAnalyticsDashboard(
  token: string,
): Promise<ProductAnalyticsDashboard> {
  return apiClient("/api/v1/analytics/admin/dashboard", { token });
}
