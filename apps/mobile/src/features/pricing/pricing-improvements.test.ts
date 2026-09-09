import { describe, expect, it } from "vitest";
import * as calc from "./calc";
import { draftForProduct, usePricingDraft } from "./use-pricing-draft";
import { act, renderHook } from "@testing-library/react";
import type { Product, Pricing } from "@lucro-caseiro/contracts";

it("preserva o rascunho ao remontar o layout e isola contas", () => {
  const first = renderHook(() => usePricingDraft(undefined, "account-a"));
  act(() =>
    first.result.current.update({
      ingredient: "12,00",
      profit: "6,00",
      alternative: "25,00",
    }),
  );
  first.unmount();
  const second = renderHook(() => usePricingDraft(undefined, "account-a"));
  expect(second.result.current.draft.ingredient).toBe("12,00");
  expect(second.result.current.draft.alternative).toBe("25,00");
  second.unmount();
  const other = renderHook(() => usePricingDraft(undefined, "account-b"));
  expect(other.result.current.draft.ingredient).toBe("");
});

it("não transforma zeros antigos em custos confirmados ao reabrir", () => {
  const product = {
    id: "p",
    costPrice: 10,
    recipeId: null,
    isComposite: false,
    components: [],
  } as unknown as Product;
  const saved = {
    ingredientCost: 10,
    packagingCost: 0,
    laborCost: 0,
    fixedCostShare: 0,
    marginPercent: 50,
    feesPercent: 0,
    allocationMode: "unit",
  } as Pricing;
  const draft = draftForProduct(product, [product], [], [], saved);
  expect(draft.labor).toBe("");
  expect(draft.fixed).toBe("");
  expect(draft.fees).toBe("");
});

describe("precificação unificada", () => {
  const input = {
    ingredientCost: 100,
    packagingCost: 0,
    laborCost: 0,
    fixedCostShare: 0,
    marginPercent: 50,
    feesPercent: 10,
    allocationMode: "revenue" as const,
    monthlyFixedCosts: 20,
    revenueBasis: 100,
  };
  it("reserva despesas e taxas e calcula margem sobre a venda cobrada", () => {
    const result = calc.pricingQuote(input);
    expect(result.finalPrice).toBeCloseTo(214.285714, 5);
    expect(calc.evaluateSalePrice(input, 200)).toEqual({
      profit: 40,
      margin: 20,
      overhead: 40,
      fees: 20,
      cost: 140,
    });
  });
  it("mostra prejuízo quando o preço alternativo não cobre os custos", () => {
    expect(calc.evaluateSalePrice(input, 100).profit).toBe(-30);
  });
  it("recusa taxas combinadas inviáveis e valores não finitos", () => {
    expect(() => calc.pricingQuote({ ...input, feesPercent: 80 })).toThrow();
    expect(() => calc.pricingQuote({ ...input, ingredientCost: NaN })).toThrow();
  });
  it("respeita o mesmo limite de custeio da API", () => {
    expect(() =>
      calc.pricingQuote({ ...input, monthlyFixedCosts: 95, feesPercent: 0 }),
    ).toThrow();
  });
});

describe("revisão dos custos", () => {
  const product = {
    id: "p1",
    name: "Bolo",
    recipeId: "r1",
    costPrice: 10,
    isComposite: false,
    components: [],
  };
  const saved = {
    id: "s1",
    productId: "p1",
    ingredientCost: 10,
    packagingCost: 2,
    channelName: null,
    createdAt: "2026-09-01T00:00:00Z",
    sourceSnapshot: {
      ingredientSource: "recipe" as const,
      recipeId: "r1",
      packaging: [{ id: "b1", unitCost: 2 }],
    },
  };
  it("detecta aumento da receita atual mesmo com custo antigo no produto", () => {
    const reviews = calc.pricingReviews(
      [saved],
      [product],
      [{ id: "r1", costPerUnit: 12 }],
      [{ id: "b1", unitCost: 2 }],
    );
    expect(reviews[0]?.increasedBy).toBe(2);
  });
  it("detecta embalagem mais cara e ignora cálculos substituídos", () => {
    const newer = {
      ...saved,
      id: "s2",
      createdAt: "2026-09-02T00:00:00Z",
      ingredientCost: 12,
    };
    const reviews = calc.pricingReviews(
      [saved, newer],
      [product],
      [{ id: "r1", costPerUnit: 12 }],
      [{ id: "b1", unitCost: 3 }],
    );
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.calculation.id).toBe("s2");
    expect(reviews[0]?.increasedBy).toBe(1);
  });
  it("não inventa vínculos para valores manuais ou cálculos antigos", () => {
    expect(
      calc.pricingReviews(
        [{ ...saved, sourceSnapshot: null }],
        [product],
        [{ id: "r1", costPerUnit: 30 }],
        [],
      ),
    ).toEqual([]);
  });
  it("sinaliza origem excluída em vez de tratar o custo como zero", () => {
    const reviews = calc.pricingReviews([saved], [product], [], []);
    expect(reviews[0]?.missingSource).toBe(true);
  });
});
