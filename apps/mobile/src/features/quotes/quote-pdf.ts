import type { Quote } from "@lucro-caseiro/contracts";
import { getActiveBrand } from "@lucro-caseiro/brands";

import { getBrandDisplayName } from "../../shared/brand-name";
import { exportHtmlPdf } from "../../shared/utils/export-html";
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
  const notes = quote.notes ? `<div class="notes">${escapeHtml(quote.notes)}</div>` : "";
  const phone = business.phone
    ? `<div class="contact">${escapeHtml(business.phone)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; margin: 0; }
  @page { size: A5 portrait; margin: 12mm; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #3d2b22; font-size: 13px; }
  .quote-page { width: 100%; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #8c5a45; padding-bottom: 14px; }
  .brand { min-width: 0; }
  .brand h1 { font-family: Georgia, serif; font-size: 22px; color: #6e4534; }
  .contact { margin-top: 4px; color: #7d6354; font-size: 12px; }
  .doc { flex-shrink: 0; text-align: right; }
  .doc .kind { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9b8275; }
  .doc .num { font-size: 16px; font-weight: 700; color: #6e4534; }
  .doc .date { margin-top: 2px; font-size: 12px; color: #7d6354; }
  h2 { font-family: Georgia, serif; font-size: 17px; color: #4a3228; margin: 14px 0 4px; }
  .meta { margin: 8px 0 4px; display: flex; flex-direction: column; gap: 4px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 13px; }
  .meta-row span { color: #9b8275; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9b8275; padding: 8px 6px; border-bottom: 1px solid #e7d9cf; }
  td { padding: 9px 6px; border-bottom: 1px solid #f3eae3; font-size: 13px; }
  .qty, .price, .subtotal, th.qty, th.price, th.subtotal { text-align: right; white-space: nowrap; }
  .subtotal { font-weight: 700; }
  .total { margin-top: 14px; background: #f7efe9; border-radius: 10px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
  .total .label { font-size: 13px; color: #7d6354; }
  .total .value { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #6e4534; }
  .notes { margin-top: 12px; font-size: 12px; color: #7d6354; background: #faf5f0; border-radius: 8px; padding: 10px 12px; }
  footer { margin-top: 26px; text-align: center; font-size: 11px; color: #9b8275; border-top: 1px solid #e7d9cf; padding-top: 12px; }
  footer strong { color: #8c5a45; }
  .brand-footer { margin-top: 6px; font-size: 10px; color: #b8a89d; }
  .brand-footer a { color: #b8a89d; text-decoration: none; }

  @media screen {
    html, body { min-height: 100%; background: #f5efeb; }
    body { padding: 28px; font-size: 15px; }
    .quote-page {
      max-width: 760px;
      margin: 0 auto;
      padding: 36px;
      background: #fff;
      border: 1px solid #eadfd7;
      border-radius: 20px;
      box-shadow: 0 12px 36px rgba(61, 43, 34, 0.10);
    }
    .brand h1 { font-size: 28px; overflow-wrap: anywhere; }
    .contact, .doc .date, .notes { font-size: 14px; }
    .doc .kind { font-size: 12px; }
    .doc .num { font-size: 18px; }
    h2 { margin-top: 20px; font-size: 22px; }
    .meta { margin: 12px 0 8px; gap: 6px; }
    .meta-row, td { font-size: 15px; }
    th { padding-top: 12px; padding-bottom: 10px; font-size: 12px; }
    td { padding-top: 12px; padding-bottom: 12px; }
    .total { margin-top: 18px; padding: 16px 18px; }
    .total .label { font-size: 15px; }
    .total .value { font-size: 28px; }
    footer { font-size: 13px; }
    .brand-footer { font-size: 12px; }
  }

  @media screen and (max-width: 600px) {
    html, body { background: #fff; }
    body { padding: 0; }
    .quote-page {
      min-height: 100vh;
      padding: 24px 18px 32px;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .head { gap: 14px; padding-bottom: 16px; }
    .brand h1 { font-size: 23px; line-height: 1.1; }
    .contact { font-size: 13px; }
    .doc .kind { font-size: 10px; letter-spacing: 1.5px; }
    .doc .num { font-size: 14px; }
    .doc .date { font-size: 11px; }
    h2 { margin-top: 18px; font-size: 20px; }
    .meta-row { font-size: 14px; }
    th { padding: 10px 4px; font-size: 10px; letter-spacing: 0.6px; }
    td { padding: 11px 4px; font-size: 13px; }
    .item { overflow-wrap: anywhere; }
    .total { padding: 15px 16px; }
    .total .value { font-size: 25px; }
    footer { margin-top: 30px; line-height: 1.45; }
  }

  @media print {
    html, body { background: #fff; }
    .quote-page { padding: 0; border: 0; box-shadow: none; }
  }
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

  <h2>${escapeHtml(quote.title)}</h2>
  <div class="meta">
    ${client}
    ${validity}
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th class="qty">Qtd.</th><th class="price">Preço</th><th class="subtotal">Subtotal</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total">
    <span class="label">Total</span>
    <span class="value">${money(quote.total)}</span>
  </div>
  ${notes}

  <footer>
    Orçamento gerado pelo <strong>${escapeHtml(brandName)}</strong> · valores sujeitos a confirmação
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
