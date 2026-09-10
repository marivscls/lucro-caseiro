import { describe, expect, it } from "vitest";

import {
  canUseQuickSale,
  cartTotal,
  formatWeight,
  itemSubtotal,
  salePricing,
  saleVariationFields,
} from "./cart";

describe("itemSubtotal", () => {
  it("multiplica preco por quantidade", () => {
    expect(itemSubtotal(10, 3)).toBe(30);
    expect(itemSubtotal(12.5, 2)).toBe(25);
  });

  it("suporta quantidade decimal (venda por peso) e preco zero", () => {
    expect(itemSubtotal(80, 1.5)).toBe(120); // 1,5 kg a R$80/kg
    expect(itemSubtotal(0, 10)).toBe(0);
  });
});

describe("cartTotal", () => {
  it("retorna 0 para carrinho vazio", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("soma os subtotais de varios itens", () => {
    expect(
      cartTotal([
        { unitPrice: 10, quantity: 2 },
        { unitPrice: 5, quantity: 3 },
      ]),
    ).toBe(35);
  });

  it("inclui itens por peso (quantidade decimal)", () => {
    expect(
      cartTotal([
        { unitPrice: 80, quantity: 1.5 }, // 120
        { unitPrice: 3, quantity: 2 }, // 6
      ]),
    ).toBe(126);
  });
});

describe("formatWeight", () => {
  it("formata kg com virgula e ate 3 casas", () => {
    expect(formatWeight(1)).toBe("1 kg");
    expect(formatWeight(1.5)).toBe("1,5 kg");
    expect(formatWeight(1.567)).toBe("1,567 kg");
    expect(formatWeight(2.5001)).toBe("2,5 kg");
  });
});

describe("canUseQuickSale", () => {
  it("permite venda rapida com exatamente 1 item e sem cliente selecionado", () => {
    expect(canUseQuickSale(1, false)).toBe(true);
  });

  it("nao permite com carrinho vazio ou mais de 1 item", () => {
    expect(canUseQuickSale(0, false)).toBe(false);
    expect(canUseQuickSale(2, false)).toBe(false);
  });

  it("nao permite quando ha cliente selecionado", () => {
    expect(canUseQuickSale(1, true)).toBe(false);
  });
});

describe("salePricing", () => {
  it("calcula desconto em valor e percentual", () => {
    expect(salePricing(100, "fixed", 15)).toEqual({
      subtotal: 100,
      discount: 15,
      total: 85,
    });
    expect(salePricing(200, "percentage", 10)).toEqual({
      subtotal: 200,
      discount: 20,
      total: 180,
    });
  });

  it("limita o desconto ao subtotal", () => {
    expect(salePricing(40, "fixed", 100).total).toBe(0);
    expect(salePricing(40, "percentage", 120).discount).toBe(40);
  });
});

describe("saleVariationFields", () => {
  it("remove dados de variação quando a marca não oferece catálogo de cores", () => {
    expect(
      saleVariationFields(false, {
        variationId: "var-rosa",
        variationName: "Rosa",
      }),
    ).toEqual({});
  });

  it("preserva dados de variação para marcas com o recurso ativo", () => {
    expect(
      saleVariationFields(true, {
        variationId: "var-rosa",
        variationName: "Rosa",
      }),
    ).toEqual({ variationId: "var-rosa", variationName: "Rosa" });
  });
});
