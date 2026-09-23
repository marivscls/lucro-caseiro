import { describe, expect, it } from "vitest";

import {
  mobileTabItems,
  resolveActiveMobileTab,
  shouldShowMobileTabBar,
} from "./mobile-tab-bar";

describe("shouldShowMobileTabBar", () => {
  it("esconde no layout desktop", () => {
    expect(
      shouldShowMobileTabBar({
        isDesktop: true,
        isAuthenticated: true,
        rootSegment: "products",
      }),
    ).toBe(false);
  });

  it("esconde sem sessão", () => {
    expect(
      shouldShowMobileTabBar({
        isDesktop: false,
        isAuthenticated: false,
        rootSegment: "tabs",
      }),
    ).toBe(false);
  });

  it("esconde em auth, onboarding e catálogo público", () => {
    for (const rootSegment of [
      "(auth)",
      "auth",
      "onboarding",
      "reset-password",
      "c",
      "",
    ]) {
      expect(
        shouldShowMobileTabBar({
          isDesktop: false,
          isAuthenticated: true,
          rootSegment,
        }),
      ).toBe(false);
    }
  });

  it("mostra nas telas autenticadas do app, inclusive fora das tabs", () => {
    for (const rootSegment of ["tabs", "products", "catalog", "lucro-apps", "settings"]) {
      expect(
        shouldShowMobileTabBar({
          isDesktop: false,
          isAuthenticated: true,
          rootSegment,
        }),
      ).toBe(true);
    }
  });
});

describe("mobileTabItems", () => {
  it("usa colunas iguais e ação central curta com nome acessível completo", () => {
    const tabs = mobileTabItems(true);

    expect(tabs).toHaveLength(5);
    expect(tabs.every((tab) => tab.primary === (tab.key === "new-sale"))).toBe(true);
    expect(tabs.find((tab) => tab.key === "new-sale")).toMatchObject({
      label: "Vender",
      accessibilityLabel: "Nova venda",
    });
    expect(tabs.map((tab) => tab.key)).toEqual([
      "index",
      "sales",
      "new-sale",
      "agenda",
      "more",
    ]);
  });

  it("troca Agenda por Clientes quando o agendamento está desligado", () => {
    expect(mobileTabItems(false).map((tab) => tab.key)).toEqual([
      "index",
      "sales",
      "new-sale",
      "clients",
      "more",
    ]);
  });
});

describe("resolveActiveMobileTab", () => {
  it("marca a tab correspondente nas rotas raiz", () => {
    expect(resolveActiveMobileTab("/tabs", true)).toBe("index");
    expect(resolveActiveMobileTab("/tabs/", false)).toBe("index");
    expect(resolveActiveMobileTab("/tabs/sales", true)).toBe("sales");
    expect(resolveActiveMobileTab("/tabs/new-sale", false)).toBe("new-sale");
    expect(resolveActiveMobileTab("/tabs/more", true)).toBe("more");
  });

  it("alterna Agenda e Clientes conforme o agendamento", () => {
    expect(resolveActiveMobileTab("/tabs/agenda", true)).toBe("agenda");
    expect(resolveActiveMobileTab("/tabs/clients", false)).toBe("clients");
    expect(resolveActiveMobileTab("/tabs/clients", true)).toBe("more");
    expect(resolveActiveMobileTab("/tabs/agenda", false)).toBe("more");
  });

  it("marca Mais em qualquer tela empilhada do app", () => {
    expect(resolveActiveMobileTab("/products", true)).toBe("more");
    expect(resolveActiveMobileTab("/catalog", false)).toBe("more");
    expect(resolveActiveMobileTab("/lucro-apps", true)).toBe("more");
  });
});
