import { describe, expect, it } from "vitest";

import { getGettingStartedStage, shouldShowGettingStarted } from "./getting-started";

describe("getGettingStartedStage", () => {
  it.each([
    [false, false, "product"],
    [true, false, "sale"],
    [true, true, "result"],
  ] as const)("resolve produto=%s venda=%s como %s", (hasProduct, hasSale, stage) => {
    expect(getGettingStartedStage(hasProduct, hasSale)).toBe(stage);
  });
});

describe("shouldShowGettingStarted", () => {
  it("espera os dados antes de decidir", () => {
    expect(
      shouldShowGettingStarted({
        settled: false,
        completed: false,
        started: false,
        hasProduct: false,
        hasSale: false,
      }),
    ).toBe(false);
  });

  it("acompanha um fluxo iniciado ate a etapa de resultado", () => {
    expect(
      shouldShowGettingStarted({
        settled: true,
        completed: false,
        started: true,
        hasProduct: true,
        hasSale: true,
      }),
    ).toBe(true);
  });

  it("nao reapresenta o guia concluido nem o estreia para uma conta ja ativa", () => {
    const base = {
      settled: true,
      hasProduct: true,
      hasSale: true,
    };

    expect(shouldShowGettingStarted({ ...base, completed: true, started: true })).toBe(
      false,
    );
    expect(shouldShowGettingStarted({ ...base, completed: false, started: false })).toBe(
      false,
    );
  });
});
