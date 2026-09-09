import { afterEach, describe, expect, it, vi } from "vitest";
import webpush from "web-push";
import { createWebPushSender } from "./web-push";

const subscription = {
  endpoint: "https://fcm.googleapis.com/example",
  keys: { p256dh: "key", auth: "auth" },
};
const message = { title: "Agenda", body: "Confira suas entregas", url: "/tabs/agenda" };
describe("Web Push transport", () => {
  afterEach(() => vi.restoreAllMocks());
  it("sends encrypted payloads through web-push with bounded timeout and TTL", async () => {
    const transport = vi
      .spyOn(webpush, "sendNotification")
      .mockResolvedValue({ statusCode: 201, headers: {}, body: "" });
    await expect(
      createWebPushSender(
        "public",
        "private",
        "mailto:support@example.com",
      )(subscription, message),
    ).resolves.toBe("sent");
    expect(transport).toHaveBeenCalledWith(
      subscription,
      JSON.stringify(message),
      expect.objectContaining({
        TTL: 3600,
        timeout: 10_000,
        vapidDetails: {
          publicKey: "public",
          privateKey: "private",
          subject: "mailto:support@example.com",
        },
      }),
    );
  });
  it.each([404, 410])("marks %s endpoints as expired", async (statusCode) => {
    vi.spyOn(webpush, "sendNotification").mockRejectedValue({ statusCode });
    await expect(
      createWebPushSender(
        "public",
        "private",
        "mailto:support@example.com",
      )(subscription, message),
    ).resolves.toBe("expired");
  });
  it("retries transient errors without propagating subscription secrets", async () => {
    vi.spyOn(webpush, "sendNotification").mockRejectedValue({
      statusCode: 503,
      body: "secret endpoint",
    });
    await expect(
      createWebPushSender(
        "public",
        "private",
        "mailto:support@example.com",
      )(subscription, message),
    ).rejects.toThrow("Falha ao enviar notificação ao navegador");
  });
});
