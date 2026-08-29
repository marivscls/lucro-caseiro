import { describe, expect, it } from "vitest";

import { resolveHomeNextStep } from "./home-next-step";

const ready = {
  settled: true,
  hasProduct: true,
  hasPriced: false,
  pricingKnown: true,
  gettingStartedVisible: false,
};

describe("resolveHomeNextStep", () => {
  it("espera os dados antes de convidar", () => {
    expect(resolveHomeNextStep({ ...ready, settled: false, hasProduct: false })).toBe(
      null,
    );
  });

  it("pede o primeiro produto quando a conta ainda não tem item", () => {
    expect(resolveHomeNextStep({ ...ready, hasProduct: false })).toBe("register-product");
  });

  it("não compete com o guia de primeiros passos", () => {
    expect(resolveHomeNextStep({ ...ready, gettingStartedVisible: true })).toBe(null);
  });

  it("convoca precificação quando já há produto e nenhum cálculo", () => {
    expect(resolveHomeNextStep(ready)).toBe("price-product");
  });

  it("some depois que a pessoa já precificou", () => {
    expect(resolveHomeNextStep({ ...ready, hasPriced: true })).toBe(null);
  });

  it("não mostra o convite se a lista de cálculos ainda não carregou", () => {
    expect(resolveHomeNextStep({ ...ready, pricingKnown: false })).toBe(null);
  });
});
