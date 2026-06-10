import type { Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { buildReceiptHtml, receiptNumber } from "./receipt-pdf";

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    userId: "user-1",
    clientId: null,
    clientName: "Joana Silva",
    paymentMethod: "pix",
    status: "paid",
    total: 45.5,
    soldAt: "2026-06-09T18:30:00.000Z",
    notes: null,
    createdAt: "2026-06-09T18:30:00.000Z",
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Bolo de Pote",
        quantity: 2,
        unitPrice: 12.5,
        subtotal: 25,
      },
      {
        id: "item-2",
        productId: "prod-2",
        productName: "Torta",
        quantity: 0.5,
        unitPrice: 41,
        subtotal: 20.5,
      },
    ],
    ...overrides,
  };
}

describe("receiptNumber", () => {
  it("gera numero curto, maiusculo e estavel a partir do id", () => {
    expect(receiptNumber("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe("A1B2C3D4");
  });
});

describe("buildReceiptHtml", () => {
  const business = { name: "Doces da Maria", phone: "(11) 99999-8888" };

  it("inclui negocio, cliente, itens e total formatado", () => {
    const html = buildReceiptHtml(makeSale(), business);
    expect(html).toContain("Doces da Maria");
    expect(html).toContain("Joana Silva");
    expect(html).toContain("Bolo de Pote");
    expect(html).toContain("R$ 45,50");
    expect(html).toContain("Pix");
  });

  it("formata quantidade por peso com kg", () => {
    const html = buildReceiptHtml(makeSale(), business);
    expect(html).toContain("0,5 kg");
  });

  it("mostra selo de pago ou pendente conforme o status", () => {
    expect(buildReceiptHtml(makeSale({ status: "paid" }), business)).toContain(
      "Pagamento recebido",
    );
    expect(buildReceiptHtml(makeSale({ status: "pending" }), business)).toContain(
      "Pagamento pendente",
    );
  });

  it("escapa HTML nos campos do usuario", () => {
    const html = buildReceiptHtml(
      makeSale({ clientName: "<script>x</script>" }),
      business,
    );
    expect(html).not.toContain("<script>x</script>");
  });

  it("sem cliente, nao renderiza a linha de cliente", () => {
    const html = buildReceiptHtml(makeSale({ clientName: null }), business);
    expect(html).not.toContain("Cliente");
  });
});
