import { apiClient } from "../utils/api-client";

export function registerPushToken(
  token: string,
  platform: "android" | "ios",
  accessToken: string,
): Promise<void> {
  return apiClient("/api/v1/notifications/push-token", {
    method: "POST",
    body: { token, platform },
    token: accessToken,
  });
}

export function unregisterPushToken(token: string, accessToken: string): Promise<void> {
  return apiClient("/api/v1/notifications/push-token", {
    method: "DELETE",
    body: { token },
    token: accessToken,
  });
}
