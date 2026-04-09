import { describe, expect, it } from "vitest";

import type { ResourceCounts } from "./subscription.types";
import {
  FREE_PLAN_LIMITS,
  buildFreemiumLimits,
  getLimitMessage,
  isLimitExceeded,
  isPremiumActive,
} from "./subscription.domain";

function makeCounts(overrides: Partial<ResourceCounts> = {}): ResourceCounts {
  return {
    salesThisMonth: 0,
    clients: 0,
    recipes: 0,
    packaging: 0,
    ...overrides,
  };
}

describe("buildFreemiumLimits", () => {
  it("returns free limits for non-premium user", () => {
    const result = buildFreemiumLimits(makeCounts({ salesThisMonth: 5 }), false);
    expect(result.maxSalesPerMonth).toBe(FREE_PLAN_LIMITS.maxSalesPerMonth);
    expect(result.currentSalesThisMonth).toBe(5);
  });

  it("returns infinite limits for premium user", () => {
    const result = buildFreemiumLimits(makeCounts(), true);
    expect(result.maxSalesPerMonth).toBe(Infinity);
    expect(result.maxClients).toBe(Infinity);
  });
});

describe("isLimitExceeded", () => {
  it("returns false when under limit", () => {
    expect(isLimitExceeded("sales", makeCounts({ salesThisMonth: 5 }))).toBe(false);
  });

  it("returns true when at sales limit", () => {
    expect(
      isLimitExceeded(
        "sales",
        makeCounts({ salesThisMonth: FREE_PLAN_LIMITS.maxSalesPerMonth }),
      ),
    ).toBe(true);
  });

  it("returns true when at clients limit", () => {
    expect(
      isLimitExceeded("clients", makeCounts({ clients: FREE_PLAN_LIMITS.maxClients })),
    ).toBe(true);
  });

  it("returns true when at recipes limit", () => {
    expect(
      isLimitExceeded("recipes", makeCounts({ recipes: FREE_PLAN_LIMITS.maxRecipes })),
    ).toBe(true);
  });

  it("returns true when at packaging limit", () => {
    expect(
      isLimitExceeded(
        "packaging",
        makeCounts({ packaging: FREE_PLAN_LIMITS.maxPackaging }),
      ),
    ).toBe(true);
  });

  it("returns false when below all limits", () => {
    expect(isLimitExceeded("sales", makeCounts())).toBe(false);
    expect(isLimitExceeded("clients", makeCounts())).toBe(false);
    expect(isLimitExceeded("recipes", makeCounts())).toBe(false);
    expect(isLimitExceeded("packaging", makeCounts())).toBe(false);
  });
});

describe("getLimitMessage", () => {
  it("returns Portuguese message for each resource type", () => {
    expect(getLimitMessage("sales")).toContain("vendas");
    expect(getLimitMessage("clients")).toContain("clientes");
    expect(getLimitMessage("recipes")).toContain("receitas");
    expect(getLimitMessage("packaging")).toContain("embalagens");
  });

  it("includes Premium mention", () => {
    expect(getLimitMessage("sales")).toContain("Premium");
  });
});

describe("isPremiumActive", () => {
  it("returns false for free plan", () => {
    expect(isPremiumActive("free", null)).toBe(false);
  });

  it("returns true for premium without expiry", () => {
    expect(isPremiumActive("premium", null)).toBe(true);
  });

  it("returns true for premium with future expiry", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isPremiumActive("premium", future)).toBe(true);
  });

  it("returns false for premium with past expiry", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isPremiumActive("premium", past)).toBe(false);
  });
});
