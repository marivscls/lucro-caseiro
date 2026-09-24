import { describe, expect, it } from "vitest";

import { freeMonthsInAnnual, priceFor, type PricingPlan } from "./pricing-plans";

const essential: PricingPlan = {
  name: "Essencial",
  description: "",
  features: [],
  featured: true,
  badge: null,
  ctaLabel: "Testar",
  monthly: 29.9,
  annual: 299,
};

describe("plano anual", () => {
  it("mostra quantos meses o anual economiza", () => {
    expect(freeMonthsInAnnual(29.9, 299)).toBe(2);
    expect(freeMonthsInAnnual(69.9, 699)).toBe(2);
  });

  it("mostra o preço mensal equivalente no anual", () => {
    const annual = priceFor(essential, "annual");
    expect(annual.price).toContain("299,00");
    expect(annual.note).toContain("24,92");
  });

  it("lembra do anual quando o período é mensal", () => {
    expect(priceFor(essential, "monthly").note).toContain("2 meses grátis");
  });

  it("mantém o Gratuito sem período", () => {
    const free = priceFor({ ...essential, monthly: null, annual: null }, "annual");
    expect(free.price).toBe("R$ 0");
  });
});
