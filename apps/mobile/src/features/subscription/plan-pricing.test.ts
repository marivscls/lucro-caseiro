import { describe, expect, it } from "vitest";

import { benefitsLeadingWith, TIER_BENEFITS } from "./plan-benefits";
import { annualSavings, planPriceDisplay } from "./plan-pricing";
import { getPaywallCopy } from "./limit-copy";

describe("planPriceDisplay", () => {
  it("shows the annual plan as a monthly value with the yearly charge below", () => {
    expect(planPriceDisplay("professional", "annual")).toEqual({
      perMonth: "R$ 37,42",
      charge: "R$ 449,00 cobrados uma vez por ano",
    });
  });

  it("keeps the monthly plan at its monthly price", () => {
    expect(planPriceDisplay("professional", "monthly")).toEqual({
      perMonth: "R$ 49,90",
      charge: "cobrado todo mês",
    });
  });

  it("computes the yearly savings against twelve monthly payments", () => {
    expect(annualSavings("professional")).toBeCloseTo(149.8);
  });
});

describe("benefitsLeadingWith", () => {
  it("moves the benefit of the triggering resource to the top", () => {
    const result = benefitsLeadingWith(TIER_BENEFITS.professional, "catalog");
    expect(result.highlighted).toBe(true);
    expect(result.benefits[0]).toBe("Catálogo completo e personalizado");
    expect(result.benefits).toHaveLength(TIER_BENEFITS.professional.length);
  });

  it("keeps the order when the resource has no matching benefit", () => {
    const result = benefitsLeadingWith(TIER_BENEFITS.professional, null);
    expect(result).toEqual({ benefits: TIER_BENEFITS.professional, highlighted: false });
  });

  it("points supplier triggers at the supplier benefit", () => {
    const result = benefitsLeadingWith(TIER_BENEFITS.professional, "suppliers");
    expect(result.benefits[0]).toBe("Fornecedores, compras e gastos fixos ilimitados");
  });

  it.each(["fiado", "orders", "financeHistory"])(
    "leads %s triggers with the fiado/agenda/financeiro benefit",
    (resource) => {
      const result = benefitsLeadingWith(TIER_BENEFITS.professional, resource);
      expect(result.benefits[0]).toBe("Fiado, agenda e financeiro completos");
    },
  );

  it("keeps the Premium list short", () => {
    expect(TIER_BENEFITS.professional.length).toBeLessThanOrEqual(10);
  });

  it("gives both paid tiers the same Premium benefits", () => {
    expect(TIER_BENEFITS.essential).toEqual(TIER_BENEFITS.professional);
  });
});

describe("getPaywallCopy title", () => {
  it("drops the banner emoji next to the checkout illustration", () => {
    expect(getPaywallCopy("catalog").title).toBe("Catálogo completo e personalizado");
    expect(getPaywallCopy("sales").title).toBe("Limite atingido!");
    expect(getPaywallCopy(null).title).toBe("Seu negócio está crescendo!");
  });
});
