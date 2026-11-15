import { describe, expect, it } from "vitest";

import { getBannerCopy, getLimitResourceLabel, getPaywallCopy } from "./limit-copy";
import { businessCopyFor } from "./business-copy";

describe("paywall copy points to the single paid plan", () => {
  it("never names the old Essencial or Profissional plans", () => {
    const resources = [
      "sales",
      "clients",
      "products",
      "recipes",
      "packaging",
      "suppliers",
      "catalog",
      "productPhotos",
      "reports",
      "advancedPricing",
      "export",
      "labels",
      "recurring",
      "purchases",
      "compositeProducts",
      "birthdays",
      "notifications",
      "prioritySupport",
      "orders",
      "fiado",
      "financeHistory",
      "quotesPdf",
    ];

    for (const resource of resources) {
      const copy = getPaywallCopy(resource);
      expect(`${copy.title} ${copy.message}`).not.toMatch(/Essencial|Profissional/);
    }
  });
});

describe("contextual limit copy", () => {
  it("usa ficha de serviço e remove o cupcake para prestadores", () => {
    const copy = businessCopyFor("services");

    expect(getBannerCopy("recipes", 1, copy)).toEqual({
      title: "📋 Falta apenas 1 ficha do serviço",
      body: "Assine o Premium e crie fichas de serviço sem limite.",
    });
    expect(getPaywallCopy("recipes", copy).message).toContain("fichas de serviço");
    expect(getPaywallCopy("recipes", copy).title).not.toContain("🧁");
  });

  it("mantém a linguagem alimentar quando esse é o perfil escolhido", () => {
    const copy = businessCopyFor("food");

    expect(getBannerCopy("recipes", 0, copy).title).toContain(
      "Limite de receitas atingido",
    );
    expect(getBannerCopy("packaging", 2, copy).body).toContain("2 embalagens");
    expect(getLimitResourceLabel("clients", copy)).toBe("clientes");
    expect(getLimitResourceLabel("recipes", copy)).toBe("receitas");
  });

  it("usa o nome contextual do recurso no progresso", () => {
    const copy = businessCopyFor("services");

    expect(getLimitResourceLabel("products", copy)).toBe("serviços");
    expect(getLimitResourceLabel("recipes", copy)).toBe("fichas de serviço");
  });
});

describe("copy do Gratuito enxuto (2026-11-15)", () => {
  it("tem paywall próprio para fiado, histórico do financeiro e orçamento em PDF", () => {
    const fallback = getPaywallCopy(null);
    for (const resource of ["fiado", "financeHistory", "quotesPdf", "orders"]) {
      expect(getPaywallCopy(resource)).not.toEqual(fallback);
    }
    expect(getPaywallCopy("financeHistory").message).toContain("semana atual");
    expect(getPaywallCopy("fiado").message).toContain("continua aqui");
  });

  it("conta as encomendas restantes do mês no banner", () => {
    expect(getBannerCopy("orders", 2).body).toBe(
      "Faltam apenas 2 encomendas do mês para atingir o limite do plano gratuito.",
    );
    expect(getLimitResourceLabel("orders", businessCopyFor("services"))).toBe(
      "atendimentos do mês",
    );
  });

  it("lembra que pedidos do catálogo continuam chegando no limite", () => {
    expect(getPaywallCopy("orders").message).toContain("catálogo continuam chegando");
  });
});
