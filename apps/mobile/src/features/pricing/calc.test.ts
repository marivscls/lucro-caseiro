import { describe, expect, it } from "vitest";

import {
  finalPriceWithFees,
  fixedCostShare,
  laborCost,
  profitMarkupPercent,
  profitPerUnit,
  suggestedPrice,
  totalCost,
} from "./calc";

describe("laborCost", () => {
  it("calcula proporcional aos minutos e ao valor da hora", () => {
    expect(laborCost(60, 30)).toBe(30);
    expect(laborCost(90, 20)).toBe(30);
    expect(laborCost(0, 50)).toBe(0);
    expect(laborCost(30, 0)).toBe(0);
  });
});

describe("fixedCostShare", () => {
  it("divide os gastos mensais pela producao sem exigir conta por fora", () => {
    expect(fixedCostShare(300, 100)).toBe(3);
    expect(fixedCostShare(300, 0)).toBe(0);
    expect(fixedCostShare(0, 100)).toBe(0);
  });
});

describe("totalCost", () => {
  it("soma insumos, embalagem, mao de obra e custo fixo", () => {
    expect(totalCost(10, 2, 5, 3)).toBe(20);
    expect(totalCost(0, 0, 0, 0)).toBe(0);
  });
});

describe("suggestedPrice", () => {
  it("aplica o acrescimo sobre o custo", () => {
    expect(suggestedPrice(10, 0)).toBe(10); // acrescimo 0 -> custo
    expect(suggestedPrice(10, 100)).toBe(20); // 100% dobra
    expect(suggestedPrice(0, 50)).toBe(0); // custo 0 -> 0
  });
});

describe("profitMarkupPercent", () => {
  it("converte lucro em acrescimo percentual sobre o custo", () => {
    expect(profitMarkupPercent(20, 10)).toBe(50);
    expect(profitMarkupPercent(10, 20)).toBe(200);
  });

  it("evita divisao por zero e percentuais negativos", () => {
    expect(profitMarkupPercent(0, 10)).toBe(0);
    expect(profitMarkupPercent(10, 0)).toBe(0);
    expect(profitMarkupPercent(10, -5)).toBe(0);
  });
});

describe("profitPerUnit", () => {
  it("e a diferenca entre preco sugerido e custo", () => {
    expect(profitPerUnit(20, 10)).toBe(10);
    expect(profitPerUnit(10, 10)).toBe(0);
  });
});

describe("finalPriceWithFees", () => {
  it("nao infla quando nao ha taxa", () => {
    expect(finalPriceWithFees(100, 0)).toEqual({ finalPrice: 100, feesAmount: 0 });
  });

  it("aplica gross-up para taxa entre 0 e 100", () => {
    // 100 / (1 - 0,2) = 125
    expect(finalPriceWithFees(100, 20)).toEqual({ finalPrice: 125, feesAmount: 25 });
  });

  it("nao aplica gross-up para taxa >= 100 (evita divisao por zero/negativo)", () => {
    expect(finalPriceWithFees(100, 100)).toEqual({ finalPrice: 100, feesAmount: 0 });
    expect(finalPriceWithFees(100, 150)).toEqual({ finalPrice: 100, feesAmount: 0 });
  });
});
