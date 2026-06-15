import { describe, expect, it } from "vitest";

import { computeQuoteTotal, quoteItemSubtotal } from "./calc";

describe("quoteItemSubtotal", () => {
  it("multiplica quantidade por preco arredondando em centavos", () => {
    expect(quoteItemSubtotal(2, 3)).toBe(6);
    expect(quoteItemSubtotal(3, 0.1)).toBe(0.3);
    expect(quoteItemSubtotal(1.5, 40)).toBe(60);
  });
});

describe("computeQuoteTotal", () => {
  it("retorna 0 para lista vazia", () => {
    expect(computeQuoteTotal([])).toBe(0);
  });

  it("soma os subtotais dos itens", () => {
    expect(
      computeQuoteTotal([
        { quantity: 1, unitPrice: 80 },
        { quantity: 20, unitPrice: 2.5 },
      ]),
    ).toBe(130);
  });

  it("ignora itens com numero invalido (NaN)", () => {
    expect(
      computeQuoteTotal([
        { quantity: NaN, unitPrice: 10 },
        { quantity: 2, unitPrice: NaN },
        { quantity: 2, unitPrice: 5 },
      ]),
    ).toBe(10);
  });

  it("aceita quantidade decimal", () => {
    expect(computeQuoteTotal([{ quantity: 2.5, unitPrice: 4 }])).toBe(10);
  });
});
