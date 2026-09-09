import { afterEach, describe, expect, it, vi } from "vitest";
import { browserPushRequest } from "./browser-push";

describe("browser push HTTP failures", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("explains a config route missing from the deployed API", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("Cannot GET /api/v1/notifications/web/config", { status: 404 }),
        ),
    );
    await expect(browserPushRequest("/config", "test-token")).rejects.toThrow(
      "O servidor ainda não recebeu a atualização de notificações.",
    );
  });
  it("preserves the API message for an expired subscription", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "A inscrição expirou." }), {
          status: 404,
        }),
      ),
    );
    await expect(browserPushRequest("/test", "test-token", "POST")).rejects.toThrow(
      "A inscrição expirou.",
    );
  });
});
