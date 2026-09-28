import { getActiveBrand } from "@lucro-caseiro/brands";
import type { MeiActivity, MeiSummary } from "@lucro-caseiro/contracts";

import { getBrandDisplayName } from "../../shared/brand-name";
import { DOCUMENT_PDF_CSS } from "../../shared/utils/document-pdf";
import { exportHtmlPdf } from "../../shared/utils/export-html";
import { formatCurrency } from "../../shared/utils/format";
import { MANROPE_HTML_HEAD } from "../../shared/utils/manrope-html";
import { playStoreUrl } from "../../shared/utils/store-link";
import { meiReportLines, monthLabel } from "./domain";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML do Relatório Mensal das Receitas Brutas, no formato do Portal do Empreendedor. */
export function buildMeiReportHtml(
  summary: Pick<MeiSummary, "year" | "month" | "monthRevenue">,
  activity: MeiActivity,
  withInvoice: number,
  business: { name: string },
): string {
  const brandName = getBrandDisplayName(getActiveBrand());
  const period = monthLabel(summary.year, summary.month);
  const rows = meiReportLines(activity, summary.monthRevenue, withInvoice)
    .map(
      (
        line,
        index,
      ) => `<tr><td colspan="2" class="item-name">${["I", "II", "III"][index]} · ${escapeHtml(line.title)}</td></tr>
      <tr><td>Com nota fiscal emitida</td><td class="subtotal">${formatCurrency(line.withInvoice)}</td></tr>
      <tr><td>Sem nota fiscal emitida</td><td class="subtotal">${formatCurrency(line.withoutInvoice)}</td></tr>
      <tr><td><strong>Total</strong></td><td class="subtotal">${formatCurrency(line.total)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Relatório MEI · ${escapeHtml(period)}</title>
${MANROPE_HTML_HEAD}
<style>${DOCUMENT_PDF_CSS}</style>
</head>
<body>
<main>
  <header class="head">
    <div class="brand">
      <h1>${escapeHtml(business.name)}</h1>
    </div>
    <div class="doc">
      <div class="kind">Relatório MEI</div>
      <div class="date">${escapeHtml(period)}</div>
    </div>
  </header>
  <div class="document-heading">
    <div class="eyebrow">Microempreendedor individual</div>
    <h2>Relatório Mensal das Receitas Brutas</h2>
  </div>
  <table>
    <caption>Receitas do mês por atividade</caption>
    <thead><tr><th scope="col">Receita bruta</th><th scope="col" class="subtotal">Valor</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <section class="summary">
    <div class="total"><span class="label">Total geral do mês</span><span class="value">${formatCurrency(summary.monthRevenue)}</span></div>
  </section>
  <section class="notes">
    <p>Guarde este relatório com as notas fiscais de compra e as notas que você emitiu no mês.</p>
    <p>Local e data: ____________________ &nbsp; Assinatura: ____________________</p>
  </section>
  <footer>
    <div class="brand-footer"><a href="${playStoreUrl("relatorio_mei")}">Feito com ${escapeHtml(brandName)}</a></div>
  </footer>
</main>
</body>
</html>`;
}

export async function exportMeiReportPdf(
  ...args: Parameters<typeof buildMeiReportHtml>
): Promise<void> {
  const [summary] = args;
  await exportHtmlPdf(buildMeiReportHtml(...args), {
    dialogTitle: "Enviar relatório do MEI",
    filename: `relatorio-mei-${summary.year}-${String(summary.month).padStart(2, "0")}.pdf`,
  });
}
