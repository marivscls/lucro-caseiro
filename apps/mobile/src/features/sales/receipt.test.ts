import type { Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { buildReceiptMessage } from "./receipt";

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    userId: "u1",
    clientId: null,
    clientName: "Maria",
    status: "paid",
    paymentMethod: "pix",
    total: 25,
    notes: null,
    items: [
      {
        id: "i1",
        productId: "p1",
        productName: "Brigadeiro",
        quantity: 10,
        unitPrice: 2.5,
        subtotal: 25,
      },
    ],
    soldAt: "2026-05-30T12:00:00.000Z",
    createdAt: "2026-05-30T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildReceiptMessage", () => {
  it("includes items, total in BRL and payment label", () => {
    const msg = buildReceiptMessage(makeSale());
    expect(msg).toContain("10x Brigadeiro");
    expect(msg).toContain("R$ 25,00");
    expect(msg).toContain("Pagamento: Pix");
    expect(msg).toContain("Cliente: Maria");
  });

  it("flags open (fiado) sales", () => {
    const msg = buildReceiptMessage(
      makeSale({ status: "pending", paymentMethod: "credit" }),
    );
    expect(msg).toContain("Pagamento: Fiado");
    expect(msg).toContain("em aberto");
  });
});
