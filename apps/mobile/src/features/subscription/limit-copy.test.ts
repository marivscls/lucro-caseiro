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
