import { describe, expect, it, vi } from "vitest";

vi.mock("../../features/analytics/metadata", () => ({
  appMetadata: () => ({ platform: "android", appVersion: "1.2.6", appBuild: "37" }),
}));

import {
  SUPPORT_WHATSAPP,
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
