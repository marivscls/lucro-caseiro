import { describe, expect, it, vi } from "vitest";

import { createExpoPushSender } from "./expo-push";

describe("createExpoPushSender", () => {
  it("envia o alerta transacional para a Expo", async () => {
    let request: RequestInit | undefined;
    const fetcher = vi.fn((_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      request = init;
      return Promise.resolve(
        new Response(JSON.stringify({ data: [{ status: "ok", id: "ticket-1" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    const send = createExpoPushSender(fetcher as unknown as typeof fetch);

    await expect(
      send(["ExponentPushToken[token-1]"], {
        title: "Nova solicitação de horário",
        body: "Corte — toque para ver os dados.",
        data: { type: "SERVICE_BOOKING" },
      }),
    ).resolves.toEqual({ invalidTokens: [] });

    if (typeof request?.body !== "string") throw new Error("Corpo não serializado");
    expect(JSON.parse(request.body)).toEqual([
      expect.objectContaining({
        to: "ExponentPushToken[token-1]",
        title: "Nova solicitação de horário",
        data: { type: "SERVICE_BOOKING" },
      }),
    ]);
  });

  it("identifica token que a Expo informa como removido", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                status: "error",
                details: { error: "DeviceNotRegistered" },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const send = createExpoPushSender(fetcher as unknown as typeof fetch);

    await expect(
      send(["ExponentPushToken[old-token]"], {
        title: "Título",
        body: "Corpo",
        data: {},
      }),
    ).resolves.toEqual({ invalidTokens: ["ExponentPushToken[old-token]"] });
  });
});
