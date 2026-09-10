import type { Sale } from "@lucro-caseiro/contracts";
import { getActiveBrand } from "@lucro-caseiro/brands";

import { getBrandDisplayName } from "../../shared/brand-name";
import { exportHtmlPdf } from "../../shared/utils/export-html";
import { MANROPE_HTML_HEAD } from "../../shared/utils/manrope-html";
import { DOCUMENT_PDF_CSS } from "../../shared/utils/document-pdf";
import { playStoreUrl } from "../../shared/utils/store-link";

import { displayProductName } from "../products/display";
import { paymentLabel } from "./payment";

export interface ReceiptBusiness {
  name: string;
  phone?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function quantity(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : `${String(value).replace(".", ",")} kg`;
}

function saleDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Numero curto e legivel do recibo, derivado do id da venda. */
export function receiptNumber(saleId: string): string {
  return saleId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** HTML do recibo (A5 retrato) — paleta da marca, pronto para PDF. */
export function buildReceiptHtml(sale: Sale, business: ReceiptBusiness): string {
  const brandName = getBrandDisplayName(getActiveBrand());
  const rows = sale.items
    .map(
      (item) => `<tr>
        <td class="item">
          <div class="item-name">${escapeHtml(displayProductName(item.productName))}</div>
          <div class="item-detail">${quantity(item.quantity)} × ${money(item.unitPrice)}</div>
        </td>
        <td class="subtotal">${money(item.subtotal)}</td>
      </tr>`,
    )
    .join("");

  const client = sale.clientName
    ? `<div class="meta-row"><span>Cliente</span><strong>${escapeHtml(sale.clientName)}</strong></div>`
    : "";
  const phone = business.phone
    ? `<div class="contact">${escapeHtml(business.phone)}</div>`
    : "";
  const paid = sale.status === "paid";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Recibo ${receiptNumber(sale.id)} · ${escapeHtml(business.name)}</title>
${MANROPE_HTML_HEAD}
<style>
${DOCUMENT_PDF_CSS}
  @media print {
    .receipt-page .head { padding-bottom: 14px; }
    .receipt-page .brand h1 { font-size: 20px; }
    .receipt-page .document-heading { margin: 14px 0 10px; }
    .receipt-page .meta { margin: 12px 0 14px; padding-bottom: 12px; }
    .receipt-page td { padding-top: 10px; padding-bottom: 10px; }
    .receipt-page .summary { margin-top: 16px; }
    .receipt-page footer { margin-top: 12px; padding-top: 10px; }
  }
</style>
</head>
<body>
<main class="receipt-page">
  <header class="head">
    <div class="brand">
      <h1>${escapeHtml(business.name)}</h1>
      ${phone}
    </div>
    <div class="doc">
      <div class="kind">Recibo</div>
      <div class="num">Nº ${receiptNumber(sale.id)}</div>
      <div class="date">${saleDate(sale.soldAt)}</div>
    </div>
  </header>

  <div class="document-heading">
    <div class="eyebrow">Resumo da venda</div>
    <h2>Recibo de venda</h2>
  </div>
  <div class="meta">
    ${client}
    <div class="meta-row"><span>Forma de pagamento</span><strong>${escapeHtml(paymentLabel(sale.paymentMethod))}</strong></div>
  </div>

  <table>
    <caption>Itens da venda</caption>
    <thead>
      <tr><th scope="col">Item / Qtd. × preço</th><th scope="col" class="subtotal">Subtotal</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <section class="summary" aria-label="Resumo da venda">
  ${
    sale.discount > 0
      ? `<div class="adjustments">
    <div class="meta-row"><span>Subtotal</span> <strong>${money(sale.subtotal)}</strong></div>
    <div class="meta-row"><span>Desconto</span> <strong>- ${money(sale.discount)}</strong></div>
  </div>`
      : ""
  }
  <div class="total">
    <span class="label">Total</span>
    <span class="value">${money(sale.total)}</span>
  </div>
  <span class="badge ${paid ? "paid" : "pending"}">${paid ? "Pagamento recebido" : "Pagamento pendente"}</span>
  </section>

  <footer>
    <p>Recibo sem valor fiscal</p>
    <div class="brand-footer"><a href="${playStoreUrl("pdf")}">Feito com ${escapeHtml(brandName)}</a></div>
  </footer>
</main>
</body>
</html>`;
}

/** Gera o PDF do recibo e abre o compartilhamento (WhatsApp, salvar, etc.). */
export async function exportReceiptPdf(
  sale: Sale,
  business: ReceiptBusiness,
): Promise<void> {
  const html = buildReceiptHtml(sale, business);
  await exportHtmlPdf(html, { dialogTitle: "Enviar recibo" });
}
