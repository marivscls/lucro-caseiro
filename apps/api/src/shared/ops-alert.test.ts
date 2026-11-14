import { describe, expect, it, vi } from "vitest";

import { createTelegramOpsAlert } from "./ops-alert";

describe("createTelegramOpsAlert", () => {
  it("is disabled when the bot token or chat id is missing", () => {
    expect(createTelegramOpsAlert("", "123")).toBeUndefined();
    expect(createTelegramOpsAlert("bot-token", "")).toBeUndefined();
  });

  it("posts the message to the configured Telegram chat", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const alert = createTelegramOpsAlert("bot-token", "123", fetchImpl)!;

    await alert("Compra nao liberou");

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.telegram.org/botbot-token/sendMessage",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchImpl.mock.calls[0]![1].body as string) as {
      chat_id: string;
      text: string;
    };
    expect(body).toMatchObject({ chat_id: "123", text: "Compra nao liberou" });
  });

  it("never throws when Telegram fails", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const alert = createTelegramOpsAlert(
      "bot-token",
      "123",
      vi.fn().mockRejectedValue(new Error("offline")),
    )!;

    await expect(alert("x")).resolves.toBeUndefined();
    expect(errorLog).toHaveBeenCalledWith("ops_alert_failed", { error: "offline" });
    errorLog.mockRestore();
  });

  it("sends the same deduplicated alert only once per hour", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    let clock = 0;
    const alert = createTelegramOpsAlert("bot-token", "123", fetchImpl, () => clock)!;

    await alert("a", { dedupeKey: "user-1" });
    clock = 30 * 60 * 1000;
    await alert("a", { dedupeKey: "user-1" });
    await alert("b", { dedupeKey: "user-2" });
    clock = 61 * 60 * 1000;
    await alert("a", { dedupeKey: "user-1" });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
