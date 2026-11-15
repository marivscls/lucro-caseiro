import type { FreemiumLimits, UserProfile } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  getLimitBannerState,
  getLimitUsage,
  isFeatureLocked,
  isLimitBlocked,
} from "./limits";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "8f98ab61-b2ea-4c7b-b2d2-4d025f8bc43c",
    email: "maria@example.com",
    name: "Maria",
    phone: null,
    businessName: "Doces da Maria",
    businessType: "food",
    avatarUrl: null,
    plan: "free",
    planExpiresAt: null,
    planIsTrial: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeLimits(overrides: Partial<FreemiumLimits> = {}): FreemiumLimits {
  return {
    maxSalesPerMonth: 50,
    maxClients: 20,
    maxRecipes: 5,
    maxPackaging: 3,
    maxProducts: 15,
    maxSuppliers: 3,
    currentSalesThisMonth: 0,
    currentClients: 0,
    currentRecipes: 0,
    currentPackaging: 0,
    currentProducts: 0,
    currentSuppliers: 0,
    ...overrides,
  };
}

describe("subscription limits", () => {
  it("does not block or show banners for professional profiles", () => {
    const profile = makeProfile({ plan: "professional" });
    const limits = makeLimits({ currentProducts: 15, maxProducts: 15 });

    expect(isLimitBlocked(limits, profile, "products")).toBe(false);
    expect(getLimitBannerState(limits, profile, "products")).toBeNull();
  });

  it("treats legacy premium profiles as professional (unlimited)", () => {
    // Simula um valor legado vindo do banco (fora do tipo PlanType atual).
    const profile = makeProfile({ plan: "premium" as unknown as UserProfile["plan"] });
    const limits = makeLimits({ currentProducts: 15, maxProducts: 15 });

    expect(isLimitBlocked(limits, profile, "products")).toBe(false);
    expect(getLimitBannerState(limits, profile, "products")).toBeNull();
  });

  it("frees volume and supplier limits for the essential tier (now Premium)", () => {
    const profile = makeProfile({ plan: "essential" });

    // Vendas/produtos: ilimitados no Premium, mesmo com payload antigo.
    const volumeLimits = makeLimits({ currentProducts: 999, maxProducts: 15 });
    expect(isLimitBlocked(volumeLimits, profile, "products")).toBe(false);
    expect(getLimitBannerState(volumeLimits, profile, "products")).toBeNull();

    // Fornecedores: também sem limite no Premium, mesmo com payload antigo.
    const supplierLimits = makeLimits({ currentSuppliers: 3, maxSuppliers: 3 });
    expect(isLimitBlocked(supplierLimits, profile, "suppliers")).toBe(false);
    expect(getLimitBannerState(supplierLimits, profile, "suppliers")).toBeNull();
  });

  it("still caps suppliers at 3 on the free plan", () => {
    const profile = makeProfile({ plan: "free" });
    const supplierLimits = makeLimits({ currentSuppliers: 3, maxSuppliers: 3 });
    expect(isLimitBlocked(supplierLimits, profile, "suppliers")).toBe(true);
    expect(getLimitBannerState(supplierLimits, profile, "suppliers")).toMatchObject({
      current: 3,
      max: 3,
      isAtLimit: true,
    });
  });

  it("treats null limits as unlimited even when profile is stale", () => {
    const profile = makeProfile({ plan: "free" });
    const limits = makeLimits({ currentPackaging: 20, maxPackaging: null });

    expect(getLimitUsage(limits, "packaging")).toEqual({ current: 20, max: null });
    expect(isLimitBlocked(limits, profile, "packaging")).toBe(false);
    expect(getLimitBannerState(limits, profile, "packaging")).toBeNull();
  });

  it("does not block or show stale free limits before profile loads", () => {
    const limits = makeLimits({ currentProducts: 15, maxProducts: 15 });

    expect(isLimitBlocked(limits, undefined, "products")).toBe(false);
    expect(getLimitBannerState(limits, undefined, "products")).toBeNull();
  });

  it("blocks and shows the at-limit banner for free profiles with a numeric limit", () => {
    const profile = makeProfile({ plan: "free" });
    const limits = makeLimits({ currentProducts: 15, maxProducts: 15 });

    expect(isLimitBlocked(limits, profile, "products")).toBe(true);
    expect(getLimitBannerState(limits, profile, "products")).toMatchObject({
      current: 15,
      max: 15,
      remaining: 0,
      isAtLimit: true,
      percentage: 100,
    });
  });

  it("exposes the exact current and maximum values for the progress copy", () => {
    const profile = makeProfile({ plan: "free" });
    const limits = makeLimits({ currentClients: 18, maxClients: 20 });

    expect(getLimitBannerState(limits, profile, "clients")).toMatchObject({
      current: 18,
      max: 20,
      remaining: 2,
      percentage: 90,
    });
  });

  describe("encomendas do mês (orders)", () => {
    it("bloqueia a 6ª encomenda do mês no Gratuito", () => {
      // Arrange
      const profile = makeProfile({ plan: "free" });
      const limits = makeLimits({ maxOrdersPerMonth: 5, currentOrdersThisMonth: 5 });

      // Act / Assert
      expect(getLimitUsage(limits, "orders")).toEqual({ current: 5, max: 5 });
      expect(isLimitBlocked(limits, profile, "orders")).toBe(true);
    });

    it("mostra o banner a partir de 2 encomendas restantes", () => {
      const profile = makeProfile({ plan: "free" });

      expect(
        getLimitBannerState(
          makeLimits({ maxOrdersPerMonth: 5, currentOrdersThisMonth: 2 }),
          profile,
          "orders",
        ),
      ).toBeNull();
      expect(
        getLimitBannerState(
          makeLimits({ maxOrdersPerMonth: 5, currentOrdersThisMonth: 3 }),
          profile,
          "orders",
        ),
      ).toMatchObject({ remaining: 2, isAtLimit: false });
    });

    it("não bloqueia quando a API ainda não manda o limite de encomendas", () => {
      const profile = makeProfile({ plan: "free" });

      expect(isLimitBlocked(makeLimits(), profile, "orders")).toBe(false);
      expect(getLimitBannerState(makeLimits(), profile, "orders")).toBeNull();
    });

    it("libera encomendas sem limite no Premium e no teste", () => {
      const limits = makeLimits({ maxOrdersPerMonth: 5, currentOrdersThisMonth: 9 });

      expect(
        isLimitBlocked(limits, makeProfile({ plan: "professional" }), "orders"),
      ).toBe(false);
      expect(
        isLimitBlocked(
          limits,
          makeProfile({ plan: "essential", planIsTrial: true }),
          "orders",
        ),
      ).toBe(false);
    });
  });

  describe("isFeatureLocked", () => {
    it("trava fiado e histórico do financeiro no Gratuito", () => {
      const free = makeProfile({ plan: "free" });

      expect(isFeatureLocked(free, "fiado")).toBe(true);
      expect(isFeatureLocked(free, "financeHistory")).toBe(true);
      expect(isFeatureLocked(free, "quotesPdf")).toBe(true);
      expect(isFeatureLocked(free, "exportBasic")).toBe(true);
    });

    it("libera tudo no Premium e volta a travar quando a assinatura expira", () => {
      expect(isFeatureLocked(makeProfile({ plan: "professional" }), "fiado")).toBe(false);
      expect(
        isFeatureLocked(
          makeProfile({ plan: "essential", planExpiresAt: "2020-01-01T00:00:00Z" }),
          "financeHistory",
        ),
      ).toBe(true);
    });

    it("não trava sem perfil carregado (o backend decide)", () => {
      expect(isFeatureLocked(undefined, "fiado")).toBe(false);
    });
  });
});
