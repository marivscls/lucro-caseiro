import type { Quote } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { buildQuoteMessage } from "./message";

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "q1",
    userId: "u1",
    clientId: null,
    clientName: "Maria",
    title: "Bolo de aniversário",
    items: [
      { description: "Bolo recheado", quantity: 1, unitPrice: 80 },
      { description: "Brigadeiro", quantity: 20, unitPrice: 2.5 },
    ],
    total: 130,
    status: "pending",
    validUntil: null,
    notes: null,
    orderId: null,
    createdAt: "2026-06-15T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildQuoteMessage", () => {
  it("monta cabecalho, itens com subtotal e total", () => {
    const msg = buildQuoteMessage(makeQuote(), "Doceria da Ana");
    expect(msg).toContain("*Orçamento: Bolo de aniversário*");
    expect(msg).toContain("Doceria da Ana");
    expect(msg).toContain("• 1x Bolo recheado: R$ 80,00");
    // 20 x 2,50 = 50,00
    expect(msg).toContain("• 20x Brigadeiro: R$ 50,00");
    expect(msg).toContain("*Total: R$ 130,00*");
    expect(msg).toContain("Qualquer dúvida é só chamar! 😊");
  });

  it("inclui validade formatada DD/MM/AAAA quando houver", () => {
    const msg = buildQuoteMessage(makeQuote({ validUntil: "2026-12-31" }), "Doceria");
    expect(msg).toContain("Válido até 31/12/2026");
  });

  it("inclui observacoes quando houver e omite quando ausente", () => {
    expect(buildQuoteMessage(makeQuote({ notes: "Entregar gelado" }), "X")).toContain(
      "Entregar gelado",
    );
    expect(buildQuoteMessage(makeQuote({ notes: null }), "X")).not.toContain("undefined");
  });

  it("formata quantidade decimal com virgula", () => {
    const msg = buildQuoteMessage(
      makeQuote({
        items: [{ description: "Doce a granel", quantity: 1.5, unitPrice: 40 }],
      }),
      "X",
    );
    expect(msg).toContain("• 1,5x Doce a granel: R$ 60,00");
  });
});
