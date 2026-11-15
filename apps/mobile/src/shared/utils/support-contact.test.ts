import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Linking: { openURL: vi.fn(() => Promise.resolve()) },
}));
vi.mock("../../features/analytics/metadata", () => ({
  appMetadata: () => ({ platform: "android", appVersion: "1.2.6", appBuild: "37" }),
}));

import { useAppAlert } from "../components/alert-store";
import {
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP,
  openSupportEmail,
  supportGmailUrl,
  supportMailtoUrl,
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

describe("support email", () => {
  it("drafts the email with the question in the mail app", () => {
    const url = supportMailtoUrl("Lucro Caseiro", "preço", "web 1.2.8");

    expect(url.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(url)).toContain("Preciso de ajuda com:\n\npreço");
  });

  it("drafts the same email in Gmail, which works without a mail app", () => {
    const url = new URL(supportGmailUrl("Lucro Caseiro", "preço", "web 1.2.8"));

    expect(url.origin).toBe("https://mail.google.com");
    expect(url.searchParams.get("view")).toBe("cm");
    expect(url.searchParams.get("to")).toBe(SUPPORT_EMAIL);
    expect(url.searchParams.get("su")).toBe("Suporte Lucro Caseiro");
    expect(url.searchParams.get("body")).toContain("preço");
  });

  it("on the web asks how to send, since a mailto link fails silently", () => {
    // Arrange
    useAppAlert.getState().hide();

    // Act
    openSupportEmail("Lucro Caseiro", "preço");

    // Assert
    const options = useAppAlert.getState().options;
    expect(options?.message).toContain(SUPPORT_EMAIL);
    expect(options?.buttons?.map((button) => button.text)).toEqual([
      "Abrir no Gmail",
      "Programa de e-mail",
      "Copiar o e-mail",
      "Cancelar",
    ]);
  });
});
