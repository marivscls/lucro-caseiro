import type { Quote } from "@lucro-caseiro/contracts";
import { getActiveBrand } from "@lucro-caseiro/brands";

import { getBrandDisplayName } from "../../shared/brand-name";
import { exportHtmlPdf } from "../../shared/utils/export-html";
import { MANROPE_HTML_HEAD } from "../../shared/utils/manrope-html";
import { DOCUMENT_PDF_CSS } from "../../shared/utils/document-pdf";
import { playStoreUrl } from "../../shared/utils/store-link";

export interface QuoteBusiness {
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

function qty(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

function dateBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function quoteNumber(quoteId: string): string {
  return quoteId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** HTML do orçamento (A5) — mesma linguagem visual do recibo. */
export function buildQuoteHtml(quote: Quote, business: QuoteBusiness): string {
  const brandName = getBrandDisplayName(getActiveBrand());
  const rows = quote.items
    .map(
      (item) => `<tr>
        <td class="item">${escapeHtml(item.description)}</td>
        <td class="qty">${qty(item.quantity)}</td>
        <td class="price">${money(item.unitPrice)}</td>
        <td class="subtotal">${money(item.quantity * item.unitPrice)}</td>
      </tr>`,
    )
    .join("");

  const client = quote.clientName
    ? `<div class="meta-row"><span>Cliente</span><strong>${escapeHtml(quote.clientName)}</strong></div>`
    : "";
  const validity = quote.validUntil
    ? `<div class="meta-row"><span>Válido até</span><strong>${quote.validUntil
        .split("-")
        .reverse()
        .join("/")}</strong></div>`
    : "";
  const notes = quote.notes
    ? `<aside class="notes"><div class="eyebrow">Observações</div><p>${escapeHtml(quote.notes)}</p></aside>`
    : "";
  const phone = business.phone
    ? `<div class="contact">${escapeHtml(business.phone)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Orçamento ${quoteNumber(quote.id)} · ${escapeHtml(business.name)}</title>
${MANROPE_HTML_HEAD}
<style>
${DOCUMENT_PDF_CSS}
</style>
</head>
<body>
<main class="quote-page">
  <div class="head">
    <div class="brand">
      <h1>${escapeHtml(business.name)}</h1>
      ${phone}
    </div>
    <div class="doc">
      <div class="kind">Orçamento</div>
      <div class="num">Nº ${quoteNumber(quote.id)}</div>
      <div class="date">${dateBR(quote.createdAt)}</div>
    </div>
  </div>

  <div class="document-heading">
    <div class="eyebrow">Proposta comercial</div>
    <h2>${escapeHtml(quote.title)}</h2>
  </div>
  <div class="meta">
    ${client}
    ${validity}
  </div>

  <table>
    <caption>Itens do orçamento</caption>
    <thead>
      <tr><th scope="col">Descrição</th><th scope="col" class="qty">Qtd.</th><th scope="col" class="price">Unitário</th><th scope="col" class="subtotal">Subtotal</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <section class="summary" aria-label="Resumo do orçamento">
  ${
    quote.discount > 0
      ? `<div class="adjustments">
    <div class="meta-row"><span>Subtotal</span><strong>${money(quote.subtotal)}</strong></div>
    <div class="meta-row"><span>Desconto</span><strong>- ${money(quote.discount)}</strong></div>
  </div>`
      : ""
  }
  <div class="total">
    <span class="label">Total do orçamento</span>
    <span class="value">${money(quote.total)}</span>
  </div>
  </section>
  ${notes}

  <footer>
    <p>Valores sujeitos a confirmação.</p>
    <div class="brand-footer"><a href="${playStoreUrl("pdf")}">Feito com ${escapeHtml(brandName)}</a></div>
  </footer>
</main>
</body>
</html>`;
}

export async function exportQuotePdf(
  quote: Quote,
  business: QuoteBusiness,
): Promise<void> {
  const html = buildQuoteHtml(quote, business);
  await exportHtmlPdf(html, { dialogTitle: "Enviar orçamento" });
}
