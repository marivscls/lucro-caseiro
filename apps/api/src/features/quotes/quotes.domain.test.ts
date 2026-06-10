import { describe, expect, it } from "vitest";

import { computeQuoteTotal, quoteItemsSummary, validateQuote } from "./quotes.domain";

describe("computeQuoteTotal", () => {
  it("soma quantidade x preco unitario", () => {
    const total = computeQuoteTotal([
      { description: "Topo de bolo", quantity: 1, unitPrice: 35 },
      { description: "Caixinha personalizada", quantity: 20, unitPrice: 4.5 },
    ]);
    expect(total).toBe(125);
  });

  it("evita erro de ponto flutuante (centavos exatos)", () => {
    const total = computeQuoteTotal([
      { description: "Tag", quantity: 3, unitPrice: 0.1 },
    ]);
    expect(total).toBe(0.3);
  });

  it("lista vazia soma zero", () => {
    expect(computeQuoteTotal([])).toBe(0);
  });
});

describe("validateQuote", () => {
  it("aceita dados validos", () => {
    expect(
      validateQuote({
        title: "Kit Safari",
        items: [{ description: "Convite", quantity: 30, unitPrice: 2 }],
      }),
    ).toHaveLength(0);
  });

  it("rejeita titulo vazio e itens vazios", () => {
    const errors = validateQuote({ title: "  ", items: [] });
    expect(errors).toContain("O título é obrigatório");
    expect(errors).toContain("Adicione pelo menos um item");
  });

  it("rejeita item sem descricao", () => {
    const errors = validateQuote({
      items: [{ description: "  ", quantity: 1, unitPrice: 1 }],
    });
    expect(errors).toContain("Todo item precisa de uma descrição");
  });

  it("rejeita validade fora do formato", () => {
    expect(validateQuote({ validUntil: "10/07/2026" })).toContain(
      "Data de validade inválida",
    );
  });
});

describe("quoteItemsSummary", () => {
  it("resume itens para a encomenda", () => {
    const summary = quoteItemsSummary([
      { description: "Convite", quantity: 30, unitPrice: 2 },
      { description: "Fita", quantity: 2.5, unitPrice: 4 },
    ]);
    expect(summary).toBe("30x Convite, 2,5x Fita");
  });
});
