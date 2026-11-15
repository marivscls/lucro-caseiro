import { describe, expect, it, vi } from "vitest";

vi.mock("../../features/analytics/metadata", () => ({
  appMetadata: () => ({ platform: "android", appVersion: "1.2.6", appBuild: "37" }),
}));

import {
  SUPPORT_WHATSAPP,
  hasWhatsAppSupport,
  supportWhatsAppAppUrl,
  supportWhatsAppMessage,
  supportWhatsAppUrl,
} from "./support-contact";

describe("supportWhatsAppMessage", () => {
  it("includes the question and the app version for the team", () => {
    const message = supportWhatsAppMessage("Lucro Caseiro", "  não consigo salvar  ");

    expect(message).toContain("Uso o Lucro Caseiro");
    expect(message).toContain("Preciso de ajuda com: não consigo salvar");
    expect(message).toContain("(App android 1.2.6 (37))");
  });

  it("asks which screen when there is no question", () => {
    expect(supportWhatsAppMessage("Lucro Caseiro", "", "web 1.2.6")).toContain(
      "A tela é:",
    );
  });

  it("limits long questions", () => {
    const message = supportWhatsAppMessage("X", "a".repeat(1000), "web");
    expect(message.length).toBeLessThan(500);
  });
});

describe("supportWhatsAppUrl", () => {
  it("opens the support number with the message encoded", () => {
    const url = supportWhatsAppUrl("Lucro Caseiro", "preço");

    expect(url.startsWith(`https://wa.me/${SUPPORT_WHATSAPP}?text=`)).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1] ?? "")).toContain("preço");
  });
});

describe("supportWhatsAppAppUrl", () => {
  it("opens the support chat straight in the WhatsApp app", () => {
    const url = supportWhatsAppAppUrl("Lucro Caseiro", "preço");

    expect(url.startsWith(`whatsapp://send?phone=${SUPPORT_WHATSAPP}&text=`)).toBe(true);
  });
});

describe("hasWhatsAppSupport", () => {
  const inDays = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  it("is a benefit of paying accounts", () => {
    expect(
      hasWhatsAppSupport({
        plan: "professional",
        planExpiresAt: inDays(20),
        planIsTrial: false,
      }),
    ).toBe(true);
  });

  it("is not offered on the free plan, during the trial or without a profile", () => {
    expect(
      hasWhatsAppSupport({ plan: "free", planExpiresAt: null, planIsTrial: false }),
    ).toBe(false);
    expect(
      hasWhatsAppSupport({
        plan: "essential",
        planExpiresAt: inDays(5),
        planIsTrial: true,
      }),
    ).toBe(false);
    expect(hasWhatsAppSupport(null)).toBe(false);
  });

  it("is not offered after the paid plan expires", () => {
    expect(
      hasWhatsAppSupport({
        plan: "professional",
        planExpiresAt: inDays(-1),
        planIsTrial: false,
      }),
    ).toBe(false);
  });
});
