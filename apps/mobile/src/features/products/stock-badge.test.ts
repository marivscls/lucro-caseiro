import type { Product } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { getStockBadge } from "./stock-badge";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    name: "Brigadeiro",
    description: null,
    category: "Doces",
    photoUrl: null,
    code: null,
    salePrice: 3.5,
    saleUnit: "unit",
    costPrice: null,
    recipeId: null,
    stockQuantity: 10,
    stockAlertThreshold: 3,
    isComposite: false,
    isActive: true,
    createdAt: "2026-06-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("getStockBadge — sem selo", () => {
  it("nao mostra selo para produto vendido por kg", () => {
    const p = makeProduct({ saleUnit: "kg", stockQuantity: 0 });
    expect(getStockBadge(p, true)).toBeNull();
  });

  it("nao mostra selo para kit (produto composto)", () => {
    const p = makeProduct({ isComposite: true, stockQuantity: 0 });
    expect(getStockBadge(p, true)).toBeNull();
  });

  it("nao mostra selo quando o produto nao controla estoque", () => {
    const p = makeProduct({ stockQuantity: null });
    expect(getStockBadge(p, true)).toBeNull();
  });
});

describe("getStockBadge — contagem neutra (sempre)", () => {
  it("mostra a contagem quando o estoque esta saudavel", () => {
    const p = makeProduct({ stockQuantity: 10, stockAlertThreshold: 3 });
    expect(getStockBadge(p, true)).toEqual({ label: "10 un.", variant: "success" });
  });

  it("mostra a contagem mesmo com a preferencia desligada", () => {
    const p = makeProduct({ stockQuantity: 10, stockAlertThreshold: 3 });
    expect(getStockBadge(p, false)).toEqual({ label: "10 un.", variant: "success" });
  });

  it("sem limite de alerta, estoque positivo conta como saudavel", () => {
    const p = makeProduct({ stockQuantity: 1, stockAlertThreshold: null });
    expect(getStockBadge(p, true)).toEqual({ label: "1 un.", variant: "success" });
  });
});

describe("getStockBadge — alertas respeitam a preferencia", () => {
  it("'Sem estoque' aparece quando ligado e some quando desligado", () => {
    const p = makeProduct({ stockQuantity: 0 });
    expect(getStockBadge(p, true)).toEqual({ label: "Sem estoque", variant: "danger" });
    expect(getStockBadge(p, false)).toBeNull();
  });

  it("'Estoque baixo' aparece quando ligado e some quando desligado", () => {
    const p = makeProduct({ stockQuantity: 2, stockAlertThreshold: 3 });
    expect(getStockBadge(p, true)).toEqual({
      label: "Estoque baixo",
      variant: "warning",
    });
    expect(getStockBadge(p, false)).toBeNull();
  });

  it("estoque igual ao limite conta como baixo", () => {
    const p = makeProduct({ stockQuantity: 3, stockAlertThreshold: 3 });
    expect(getStockBadge(p, true)).toEqual({
      label: "Estoque baixo",
      variant: "warning",
    });
  });
});
