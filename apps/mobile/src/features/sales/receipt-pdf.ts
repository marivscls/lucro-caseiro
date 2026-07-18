import type { Sale } from "@lucro-caseiro/contracts";

import { exportHtmlPdf } from "../../shared/utils/export-html";
import { playStoreUrl } from "../../shared/utils/store-link";

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
  const rows = sale.items
    .map(
      (item) => `<tr>
        <td class="item">${escapeHtml(item.productName)}</td>
        <td class="qty">${quantity(item.quantity)}</td>
        <td class="price">${money(item.unitPrice)}</td>
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
  .meta { margin: 14px 0; display: flex; flex-direction: column; gap: 4px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 13px; }
  .meta-row span { color: #9b8275; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9b8275; padding: 8px 6px; border-bottom: 1px solid #e7d9cf; }
  td { padding: 9px 6px; border-bottom: 1px solid #f3eae3; font-size: 13px; }
  .qty, .price, .subtotal, th.qty, th.price, th.subtotal { text-align: right; white-space: nowrap; }
  .subtotal { font-weight: 700; }
  .total { margin-top: 14px; background: #f7efe9; border-radius: 10px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
  .total .label { font-size: 13px; color: #7d6354; }
  .total .value { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #2e7d32; }
  .badge { display: inline-block; margin-top: 10px; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; ${
    paid ? "background: #e7f4ec; color: #2e7d32;" : "background: #fdf3e0; color: #9c6f26;"
  } }
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
      <div class="kind">Recibo</div>
      <div class="num">Nº ${receiptNumber(sale.id)}</div>
      <div class="date">${saleDate(sale.soldAt)}</div>
    </div>
  </div>

  <div class="meta">
    ${client}
    <div class="meta-row"><span>Forma de pagamento</span><strong>${escapeHtml(paymentLabel(sale.paymentMethod))}</strong></div>
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th class="qty">Qtd.</th><th class="price">Preço</th><th class="subtotal">Subtotal</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total">
    <span class="label">Total</span>
    <span class="value">${money(sale.total)}</span>
  </div>
  <span class="badge">${paid ? "✓ Pagamento recebido" : "Pagamento pendente"}</span>

  <footer>
    Recibo gerado pelo <strong>Lucro Caseiro</strong> · sem valor fiscal
    <div class="brand-footer"><a href="${playStoreUrl("pdf")}">Feito com Lucro Caseiro</a></div>
  </footer>
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
