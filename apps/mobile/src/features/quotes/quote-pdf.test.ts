import type { Quote } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { buildQuoteHtml } from "./quote-pdf";

const quote: Quote = {
  id: "12345678-1234-1234-1234-123456789012",
  userId: "12345678-1234-1234-1234-123456789012",
  clientId: null,
  clientName: "Mariana",
  title: "Festa Safari",
  items: [{ description: "Convite", quantity: 1, unitPrice: 20 }],
  total: 20,
  status: "pending",
  validUntil: "2026-07-21",
  notes: null,
  orderId: null,
  createdAt: "2026-07-20T12:00:00.000Z",
};

describe("buildQuoteHtml", () => {
  it("gera uma leitura responsiva no navegador sem alterar o layout de impressao", () => {
    const html = buildQuoteHtml(quote, { name: "Delicias da Mariana" });

    expect(html).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    );
    expect(html).toContain("@media screen and (max-width: 600px)");
    expect(html).toContain("@media print");
    expect(html).toContain('<main class="quote-page">');
  });
});
