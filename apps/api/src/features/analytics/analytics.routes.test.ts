import { describe, expect, it } from "vitest";

import { isAdminUser } from "./analytics.admin";
import { parseRecordEvents, parseRecordOpen } from "./analytics.validation";

const ENVELOPE = {
  installationId: "0cbd1c3e-1755-4f3f-a1bf-40c12b267ac3",
  platform: "android",
  appVersion: "1.2.0",
};

describe("isAdminUser", () => {
  const admins = new Set(["user-admin"]);

  it("autoriza somente IDs configurados", () => {
    expect(isAdminUser("user-admin", admins)).toBe(true);
    expect(isAdminUser("user-common", admins)).toBe(false);
  });

  it("nega todos quando a lista está vazia", () => {
    expect(isAdminUser("user-admin", new Set())).toBe(false);
  });
});

describe("parseRecordEvents", () => {
  it("aceita somente telas e ações canônicas", () => {
    expect(
      parseRecordEvents({
        ...ENVELOPE,
        events: [
          { type: "screen_view", name: "pricing", durationMs: 1_000 },
          { type: "action", name: "pricing_completed" },
        ],
      }),
    ).toMatchObject({ events: [{ name: "pricing" }, { name: "pricing_completed" }] });

    expect(() =>
      parseRecordEvents({
        ...ENVELOPE,
        events: [{ type: "action", name: "free_text", metadata: { secret: true } }],
      }),
    ).toThrow();
  });

  it("rejeita duração acidental ou acima de seis horas", () => {
    for (const durationMs of [249, 21_600_001]) {
      expect(() =>
        parseRecordEvents({
          ...ENVELOPE,
          events: [{ type: "screen_view", name: "home", durationMs }],
        }),
      ).toThrow();
    }
  });
});

describe("parseRecordOpen — origem da instalação", () => {
  it("aceita origem opcional com campos conhecidos e remove espaços", () => {
    // Arrange
    const payload = {
      ...ENVELOPE,
      acquisition: {
        utmSource: " site_publico ",
        utmContent: "pwa_header",
        referrer: "google.com",
      },
    };

    // Act
    const result = parseRecordOpen(payload);

    // Assert
    expect(result.acquisition).toEqual({
      utmSource: "site_publico",
      utmContent: "pwa_header",
      referrer: "google.com",
    });
    expect(parseRecordOpen(ENVELOPE).acquisition).toBeUndefined();
  });

  it("rejeita chave desconhecida, valor longo demais ou com caractere de controle", () => {
    // Arrange
    const invalid = [
      { utmSource: "site", email: "pessoa@exemplo.com" },
      { utmSource: "x".repeat(101) },
      { referrer: "x".repeat(201) },
      { utmCampaign: "linha\nquebrada" },
      { utmMedium: "" },
    ];

    // Act / Assert
    for (const acquisition of invalid) {
      expect(() => parseRecordOpen({ ...ENVELOPE, acquisition })).toThrow();
    }
  });
});
