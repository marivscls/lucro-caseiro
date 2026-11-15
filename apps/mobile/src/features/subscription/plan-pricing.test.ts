import { describe, expect, it } from "vitest";

import { benefitsLeadingWith, TIER_BENEFITS } from "./plan-benefits";
import { annualSavings, planPriceDisplay } from "./plan-pricing";
import { getPaywallCopy } from "./limit-copy";

describe("planPriceDisplay", () => {
  it("shows the annual plan as a monthly value with the yearly charge below", () => {
    expect(planPriceDisplay("essential", "annual")).toEqual({
      perMonth: "R$ 24,92",
      charge: "R$ 299,00 cobrados uma vez por ano",
    });
  });

  it("keeps the monthly plan at its monthly price", () => {
    expect(planPriceDisplay("professional", "monthly")).toEqual({
      perMonth: "R$ 69,90",
      charge: "cobrado todo mês",
    });
  });

  it("computes the yearly savings against twelve monthly payments", () => {
    expect(annualSavings("essential")).toBeCloseTo(59.8);
  });
});

describe("benefitsLeadingWith", () => {
  it("moves the benefit of the triggering resource to the top", () => {
    const result = benefitsLeadingWith("essential", TIER_BENEFITS.essential, "catalog");
    expect(result.highlighted).toBe(true);
    expect(result.benefits[0]).toBe("Catálogo completo e personalizado");
    expect(result.benefits).toHaveLength(TIER_BENEFITS.essential.length);
  });

  it("keeps the order when the resource has no matching benefit", () => {
    const result = benefitsLeadingWith("essential", TIER_BENEFITS.essential, null);
    expect(result).toEqual({ benefits: TIER_BENEFITS.essential, highlighted: false });
  });

  it("points professional triggers at the professional benefit", () => {
    const result = benefitsLeadingWith(
      "professional",
      TIER_BENEFITS.professional,
      "suppliers",
    );
    expect(result.benefits[0]).toBe("Fornecedores, compras e gastos fixos ilimitados");
  });

  it("does not sell the free supplier cap as an essential benefit", () => {
    expect(TIER_BENEFITS.essential.some((b) => b.startsWith("Fornecedores"))).toBe(false);
  });
});

describe("getPaywallCopy title", () => {
  it("drops the banner emoji next to the checkout illustration", () => {
    expect(getPaywallCopy("catalog").title).toBe("Catálogo completo e personalizado");
    expect(getPaywallCopy("sales").title).toBe("Limite atingido!");
    expect(getPaywallCopy(null).title).toBe("Seu negócio está crescendo!");
  });
});
