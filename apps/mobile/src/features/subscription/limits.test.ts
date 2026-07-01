import type { FreemiumLimits, UserProfile } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { getLimitBannerState, getLimitUsage, isLimitBlocked } from "./limits";

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

  it("frees volume limits for essential but still caps suppliers at 3", () => {
    const profile = makeProfile({ plan: "essential" });

    // Vendas/produtos: ilimitados no Essencial, mesmo com payload antigo.
    const volumeLimits = makeLimits({ currentProducts: 999, maxProducts: 15 });
    expect(isLimitBlocked(volumeLimits, profile, "products")).toBe(false);
    expect(getLimitBannerState(volumeLimits, profile, "products")).toBeNull();

    // Fornecedores: ainda limitados (max 3).
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
});
