import { PLAN_PRICING, SOLD_PLAN } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { annualMonthlyEquivalent, annualSavings } from "./plan-price";
import { priceFor, type PricingPlan } from "./pricing-plans";

const premium: PricingPlan = {
  name: "Premium",
  description: "",
  features: [],
  featured: true,
  badge: null,
  ctaLabel: "Testar",
  monthly: PLAN_PRICING[SOLD_PLAN].monthly,
  annual: PLAN_PRICING[SOLD_PLAN].annual,
};

describe("preço do Premium", () => {
  it("usa o preço único do Premium: R$ 49,90 por mês ou R$ 449 por ano", () => {
    expect(premium.monthly).toBe(49.9);
    expect(premium.annual).toBe(449);
  });

  it("calcula o valor por mês do anual e a economia no ano", () => {
    expect(annualMonthlyEquivalent(449)).toBe(37.42);
    expect(annualSavings(49.9, 449)).toBe(149.8);
  });

  it("destaca o valor por mês no anual e diz o que é cobrado logo abaixo", () => {
    const annual = priceFor(premium, "annual");
    expect(annual.price).toContain("37,42");
    expect(annual.period).toBe("por mês, no plano anual");
    expect(annual.note).toContain("449,00 cobrados uma vez por ano");
    expect(annual.note).toContain("Economia de R$");
    expect(annual.note).toContain("149,80 no ano");
  });

  it("no mensal mostra a mensalidade e lembra do valor do anual", () => {
    const monthly = priceFor(premium, "monthly");
    expect(monthly.price).toContain("49,90");
    expect(monthly.period).toBe("por mês");
    expect(monthly.note).toContain("49,90 cobrados todo mês");
    expect(monthly.note).toContain("37,42 por mês");
  });

  it("não fala em economia quando o anual não economiza nada", () => {
    const flat = priceFor({ ...premium, monthly: 10, annual: 120 }, "annual");
    expect(flat.note).not.toContain("Economia");
  });

  it("mantém o Gratuito sem período", () => {
    const free = priceFor({ ...premium, monthly: null, annual: null }, "annual");
    expect(free.price).toBe("R$ 0");
    expect(free.period).toBe("para sempre");
  });
});
