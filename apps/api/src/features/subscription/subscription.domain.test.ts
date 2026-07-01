import { describe, expect, it } from "vitest";

import type { ResourceCounts } from "./subscription.types";
import {
  buildFreemiumLimits,
  getLimitMessage,
  isLimitExceeded,
  isPaidPlanActive,
  resolvePlan,
} from "./subscription.domain";

function makeCounts(overrides: Partial<ResourceCounts> = {}): ResourceCounts {
  return {
    salesThisMonth: 0,
    clients: 0,
    recipes: 0,
    packaging: 0,
    products: 0,
    suppliers: 0,
    ...overrides,
  };
}

describe("buildFreemiumLimits", () => {
  it("returns free limits for free plan", () => {
    const result = buildFreemiumLimits(makeCounts({ salesThisMonth: 5 }), "free");
    expect(result.maxSalesPerMonth).toBe(30);
    expect(result.maxClients).toBe(20);
    expect(result.currentSalesThisMonth).toBe(5);
  });

  it("returns null volume limits for essential but keeps suppliers capped", () => {
    const result = buildFreemiumLimits(makeCounts(), "essential");
    expect(result.maxSalesPerMonth).toBeNull();
    expect(result.maxClients).toBeNull();
    expect(result.maxProducts).toBeNull();
    expect(result.maxRecipes).toBeNull();
    expect(result.maxPackaging).toBeNull();
    // Fornecedores só liberam no Profissional.
    expect(result.maxSuppliers).toBe(3);
  });

  it("returns null limits for professional plan", () => {
    const result = buildFreemiumLimits(makeCounts(), "professional");
    expect(result.maxSalesPerMonth).toBeNull();
    expect(result.maxClients).toBeNull();
    expect(result.maxSuppliers).toBeNull();
  });
});

describe("isLimitExceeded", () => {
  it("returns false when under limit", () => {
    expect(isLimitExceeded("sales", makeCounts({ salesThisMonth: 5 }), "free")).toBe(
      false,
    );
  });

  it("returns true when at sales limit", () => {
    expect(isLimitExceeded("sales", makeCounts({ salesThisMonth: 30 }), "free")).toBe(
      true,
    );
  });

  it("returns true when at clients limit", () => {
    expect(isLimitExceeded("clients", makeCounts({ clients: 20 }), "free")).toBe(true);
  });

  it("returns true when at recipes limit", () => {
    expect(isLimitExceeded("recipes", makeCounts({ recipes: 5 }), "free")).toBe(true);
  });

  it("returns true when at packaging limit", () => {
    expect(isLimitExceeded("packaging", makeCounts({ packaging: 3 }), "free")).toBe(true);
  });

  it("returns true when at products limit", () => {
    expect(isLimitExceeded("products", makeCounts({ products: 15 }), "free")).toBe(true);
  });

  it("returns true when at suppliers limit", () => {
    expect(isLimitExceeded("suppliers", makeCounts({ suppliers: 3 }), "free")).toBe(true);
  });

  it("returns false when below all limits on free", () => {
    expect(isLimitExceeded("sales", makeCounts(), "free")).toBe(false);
    expect(isLimitExceeded("clients", makeCounts(), "free")).toBe(false);
    expect(isLimitExceeded("recipes", makeCounts(), "free")).toBe(false);
    expect(isLimitExceeded("packaging", makeCounts(), "free")).toBe(false);
    expect(isLimitExceeded("products", makeCounts(), "free")).toBe(false);
    expect(isLimitExceeded("suppliers", makeCounts(), "free")).toBe(false);
  });

  it("never exceeds volume limits on essential but still caps suppliers", () => {
    const heavy = makeCounts({
      salesThisMonth: 9999,
      clients: 9999,
      products: 9999,
      suppliers: 3,
    });
    expect(isLimitExceeded("sales", heavy, "essential")).toBe(false);
    expect(isLimitExceeded("clients", heavy, "essential")).toBe(false);
    expect(isLimitExceeded("products", heavy, "essential")).toBe(false);
    expect(isLimitExceeded("suppliers", heavy, "essential")).toBe(true);
  });

  it("never exceeds any limit on professional", () => {
    const heavy = makeCounts({ salesThisMonth: 9999, suppliers: 9999 });
    expect(isLimitExceeded("sales", heavy, "professional")).toBe(false);
    expect(isLimitExceeded("suppliers", heavy, "professional")).toBe(false);
  });
});

describe("getLimitMessage", () => {
  it("returns Portuguese message for each resource type", () => {
    expect(getLimitMessage("sales")).toContain("vendas");
    expect(getLimitMessage("clients")).toContain("clientes");
    expect(getLimitMessage("recipes")).toContain("receitas");
    expect(getLimitMessage("packaging")).toContain("embalagens");
    expect(getLimitMessage("products")).toContain("produtos");
    expect(getLimitMessage("suppliers")).toContain("fornecedores");
  });

  it("upsells volume resources to Essencial and suppliers to Profissional", () => {
    expect(getLimitMessage("sales")).toContain("Essencial");
    expect(getLimitMessage("suppliers")).toContain("Profissional");
  });
});

describe("resolvePlan", () => {
  it("keeps free as free", () => {
    expect(resolvePlan("free", null)).toBe("free");
  });

  it("normalizes legacy premium to professional", () => {
    expect(resolvePlan("premium", null)).toBe("professional");
  });

  it("keeps essential and professional as-is", () => {
    expect(resolvePlan("essential", null)).toBe("essential");
    expect(resolvePlan("professional", null)).toBe("professional");
  });

  it("falls back to free when a paid plan has expired", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(resolvePlan("essential", past)).toBe("free");
    expect(resolvePlan("premium", past)).toBe("free");
  });

  it("keeps a paid plan active with a future expiry", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(resolvePlan("essential", future)).toBe("essential");
  });
});

describe("isPaidPlanActive", () => {
  it("returns false for free plan", () => {
    expect(isPaidPlanActive("free", null)).toBe(false);
  });

  it("returns true for paid plan without expiry", () => {
    expect(isPaidPlanActive("professional", null)).toBe(true);
    expect(isPaidPlanActive("essential", null)).toBe(true);
  });

  it("returns true for legacy premium (normalized to professional)", () => {
    expect(isPaidPlanActive("premium", null)).toBe(true);
  });

  it("returns true for paid plan with future expiry", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isPaidPlanActive("essential", future)).toBe(true);
  });

  it("returns false for paid plan with past expiry", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isPaidPlanActive("professional", past)).toBe(false);
  });
});
