import { describe, expect, it, vi } from "vitest";

import type { INotificationsRepo } from "./notifications.types";
import { NotificationsUseCases } from "./notifications.usecases";

function makeRepo(overrides: Partial<INotificationsRepo> = {}): INotificationsRepo {
  return {
    registerToken: vi.fn(() => Promise.resolve()),
    unregisterToken: vi.fn(() => Promise.resolve()),
    listTokens: vi.fn(() => Promise.resolve([])),
    deleteTokens: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

describe("NotificationsUseCases", () => {
  it("registra o token no usuário e marca corretos", async () => {
    const registerToken = vi.fn(() => Promise.resolve());
    const sut = new NotificationsUseCases(makeRepo({ registerToken }), vi.fn());

    await sut.registerDevice("user-1", "lucro-caseiro", {
      token: "ExponentPushToken[token-1]",
      platform: "android",
    });

    expect(registerToken).toHaveBeenCalledWith("user-1", "lucro-caseiro", {
      token: "ExponentPushToken[token-1]",
      platform: "android",
    });
  });

  it("envia nova solicitação e remove tokens inválidos", async () => {
    const deleteTokens = vi.fn(() => Promise.resolve());
    const sendPush = vi.fn(() =>
      Promise.resolve({ invalidTokens: ["ExponentPushToken[old]"] }),
    );
    const sut = new NotificationsUseCases(
      makeRepo({
        listTokens: () => Promise.resolve(["ExponentPushToken[current]"]),
        deleteTokens,
      }),
      sendPush,
    );

    await sut.notifyServiceBooking(
      "user-1",
      "lucro-caseiro",
      "service-1",
      "Teste de serviço 2",
      "booking-1",
    );

    expect(sendPush).toHaveBeenCalledWith(
      ["ExponentPushToken[current]"],
      expect.objectContaining({
        title: "Nova solicitação de horário",
        body: "Teste de serviço 2 — toque para ver os dados.",
        data: {
          type: "SERVICE_BOOKING",
          serviceId: "service-1",
          bookingRequestId: "booking-1",
        },
      }),
    );
    expect(deleteTokens).toHaveBeenCalledWith(["ExponentPushToken[old]"]);
  });

  it("não chama a Expo quando o usuário não tem aparelho registrado", async () => {
    const sendPush = vi.fn();
    const sut = new NotificationsUseCases(makeRepo(), sendPush);

    await sut.notifyServiceBooking(
      "user-1",
      "lucro-caseiro",
      "service-1",
      "Corte",
      "booking-1",
    );

    expect(sendPush).not.toHaveBeenCalled();
  });
});
