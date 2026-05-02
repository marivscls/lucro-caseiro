import { describe, expect, it, beforeEach } from "vitest";
import { router } from "expo-router";
import type { NotificationResponse } from "expo-notifications";

import { handleNotificationResponse, NOTIFICATION_TYPES } from "./notification-types";

function makeResponse(type?: string): NotificationResponse {
  return {
    notification: {
      request: {
        content: {
          data: type ? { type } : undefined,
        },
      },
    },
    actionIdentifier: "default",
  } as unknown as NotificationResponse;
}

describe("NOTIFICATION_TYPES", () => {
  it("has all expected types", () => {
    expect(NOTIFICATION_TYPES.PENDING_SALES).toBe("PENDING_SALES");
    expect(NOTIFICATION_TYPES.CLIENT_BIRTHDAY).toBe("CLIENT_BIRTHDAY");
    expect(NOTIFICATION_TYPES.LOW_STOCK).toBe("LOW_STOCK");
    expect(NOTIFICATION_TYPES.WEEKLY_SUMMARY).toBe("WEEKLY_SUMMARY");
    expect(NOTIFICATION_TYPES.DAILY_REMINDER).toBe("DAILY_REMINDER");
    expect(NOTIFICATION_TYPES.TRIAL_EXPIRING).toBe("TRIAL_EXPIRING");
  });
});

describe("handleNotificationResponse", () => {
  beforeEach(() => {
    (router.push as ReturnType<typeof import("vitest").vi.fn>).mockReset();
  });

  it("navigates to /tabs for PENDING_SALES", () => {
    handleNotificationResponse(makeResponse("PENDING_SALES"));
    expect(router.push).toHaveBeenCalledWith("/tabs");
  });

  it("navigates to /tabs/clients for CLIENT_BIRTHDAY", () => {
    handleNotificationResponse(makeResponse("CLIENT_BIRTHDAY"));
    expect(router.push).toHaveBeenCalledWith("/tabs/clients");
  });

  it("navigates to /products for LOW_STOCK", () => {
    handleNotificationResponse(makeResponse("LOW_STOCK"));
    expect(router.push).toHaveBeenCalledWith("/products");
  });

  it("navigates to /finance for WEEKLY_SUMMARY", () => {
    handleNotificationResponse(makeResponse("WEEKLY_SUMMARY"));
    expect(router.push).toHaveBeenCalledWith("/finance");
  });

  it("navigates to /finance for DAILY_REMINDER", () => {
    handleNotificationResponse(makeResponse("DAILY_REMINDER"));
    expect(router.push).toHaveBeenCalledWith("/finance");
  });

  it("navigates to /plans for TRIAL_EXPIRING", () => {
    handleNotificationResponse(makeResponse("TRIAL_EXPIRING"));
    expect(router.push).toHaveBeenCalledWith("/plans");
  });

  it("does not navigate when data is undefined", () => {
    handleNotificationResponse(makeResponse());
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not navigate when type is missing", () => {
    const response = {
      notification: { request: { content: { data: {} } } },
      actionIdentifier: "default",
    } as unknown as NotificationResponse;
    handleNotificationResponse(response);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not throw when data is null", () => {
    const response = {
      notification: { request: { content: { data: null } } },
      actionIdentifier: "default",
    } as unknown as NotificationResponse;
    expect(() => handleNotificationResponse(response)).not.toThrow();
  });
});
