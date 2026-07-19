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
<style>
  * { box-sizing: border-box; margin: 0; }
  @page { size: A5 portrait; margin: 12mm; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #3d2b22; font-size: 13px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #8c5a45; padding-bottom: 14px; }
  .brand h1 { font-family: Georgia, serif; font-size: 22px; color: #6e4534; }
  .contact { margin-top: 4px; color: #7d6354; font-size: 12px; }
  .doc { text-align: right; }
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
</style>
</head>
<body>
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
