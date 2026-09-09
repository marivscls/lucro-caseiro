import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserNotifications } from "./browser-notifications";

describe("browser notifications", () => {
  const request = vi.fn();
  const unsubscribe = vi.fn();
  const subscribe = vi.fn();
  const permission = vi.fn();
  const subscription = {
    endpoint: "https://fcm.googleapis.com/x",
    toJSON: () => ({
      endpoint: "https://fcm.googleapis.com/x",
      keys: { auth: "auth", p256dh: "key" },
    }),
    unsubscribe,
  };
  const getSubscription = vi.fn();
  const registration = { active: {}, pushManager: { subscribe, getSubscription } };
  let client: BrowserNotifications;
  beforeEach(() => {
    vi.resetAllMocks();
    getSubscription.mockResolvedValue(null);
    subscribe.mockResolvedValue(subscription);
    unsubscribe.mockResolvedValue(true);
    permission.mockResolvedValue("granted");
    client = new BrowserNotifications({
      supported: () => true,
      permission: () => "default",
      requestPermission: permission,
      registration: () =>
        Promise.resolve(registration as unknown as ServiceWorkerRegistration),
      request,
    });
  });
  it("requests permission from the click before awaiting browser setup", async () => {
    const pending = client.enable("token", "AQID", {});
    expect(permission).toHaveBeenCalledTimes(1);
    await pending;
    expect(request).toHaveBeenCalledWith(
      "/subscription",
      "token",
      "PUT",
      expect.objectContaining({ endpoint: subscription.endpoint, prefs: {} }),
    );
  });
  it("does not register a denied permission", async () => {
    permission.mockResolvedValue("denied");
    await expect(client.enable("token", "AQID", {})).rejects.toThrow(/bloqueadas/);
    expect(subscribe).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });
  it("rolls back a new browser subscription when server registration fails", async () => {
    request.mockRejectedValue(new Error("offline"));
    await expect(client.enable("token", "AQID", {})).rejects.toThrow("offline");
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
  it("does not remove an existing subscription on a transient sync failure", async () => {
    getSubscription.mockResolvedValue(subscription);
    request.mockRejectedValue(new Error("offline"));
    await expect(client.enable("token", "AQID", {})).rejects.toThrow("offline");
    expect(unsubscribe).not.toHaveBeenCalled();
  });
  it("unsubscribes locally even if the server is offline during logout", async () => {
    getSubscription.mockResolvedValue(subscription);
    request.mockRejectedValue(new Error("offline"));
    await expect(client.disable("token")).rejects.toThrow("offline");
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
  it("refuses activation when there is no active service worker", async () => {
    client = new BrowserNotifications({
      supported: () => true,
      permission: () => "granted",
      requestPermission: permission,
      registration: () => Promise.resolve(undefined),
      request,
    });
    await expect(client.enable("token", "AQID", {})).rejects.toThrow(/atualize/i);
  });
  it("removes a registration that finishes after logout", async () => {
    getSubscription.mockResolvedValue(subscription);
    let complete = () => {};
    request.mockImplementation((_path, _token, method) =>
      method === "PUT"
        ? new Promise<void>((resolve) => {
            complete = resolve;
          })
        : Promise.resolve(),
    );
    const saving = client.sync(
      "old-token",
      subscription as unknown as PushSubscription,
      {},
    );
    await client.disable("old-token");
    complete();
    await expect(saving).rejects.toThrow(/cancelada/);
    expect(request.mock.calls.at(-1)?.slice(0, 3)).toEqual([
      "/subscription",
      "old-token",
      "DELETE",
    ]);
  });
});
