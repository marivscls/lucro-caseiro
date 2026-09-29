import { describe, expect, it } from "vitest";

import { draftToSale, draftTotal, usageExhausted, usageLabel } from "./domain";

const PRODUCT = "11111111-1111-4111-8111-111111111111";
const CLIENT = "22222222-2222-4222-8222-222222222222";

describe("assistant domain", () => {
  it("vira venda quando todos os itens foram reconhecidos", () => {
    const result = draftToSale(
      {
        items: [{ productId: PRODUCT, name: "Marmita", quantity: 2, unitPrice: 18 }],
        clientId: CLIENT,
        notes: null,
      },
      "credit",
    );
    expect(result).toEqual({
      ok: true,
      sale: {
        paymentMethod: "credit",
        clientId: CLIENT,
        items: [{ productId: PRODUCT, quantity: 2, unitPrice: 18 }],
      },
    });
  });

  it("aponta os itens que o app não achou", () => {
    const result = draftToSale(
      {
        items: [
          { productId: PRODUCT, name: "Marmita", quantity: 1, unitPrice: 18 },
          { productId: null, name: "Suco", quantity: 1, unitPrice: 6 },
        ],
        clientId: null,
        notes: null,
      },
      "pix",
    );
    expect(result).toEqual({ ok: false, reason: "unknown_items", names: ["Suco"] });
  });

  it("recusa rascunho vazio", () => {
    expect(draftToSale({ items: [], clientId: null, notes: null }, "pix")).toMatchObject({
      reason: "empty",
    });
  });

  it("soma o total do rascunho", () => {
    expect(
      draftTotal([
        { productId: PRODUCT, name: "A", quantity: 3, unitPrice: 2.5 },
        { productId: null, name: "B", quantity: 1, unitPrice: null },
      ]),
    ).toBe(7.5);
  });

  it("descreve o uso do mês", () => {
    expect(usageLabel({ used: 14, limit: 15 })).toBe("Resta 1 uso este mês");
    expect(usageLabel({ used: 2, limit: null })).toBe("Uso liberado no seu plano");
    expect(usageExhausted({ used: 15, limit: 15 })).toBe(true);
  });
});
