import type { Recipe } from "@lucro-caseiro/contracts";

import { exportHtmlPdf } from "../../shared/utils/export-html";
import { formatCurrency } from "../../shared/utils/format";
import { playStoreUrl } from "../../shared/utils/store-link";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Formata quantidade com vírgula decimal, sem zeros à direita supérfluos. */
function formatQuantity(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toString().replace(".", ",");
}

/**
 * Monta o HTML imprimível da receita: nome, categoria, rendimento, tabela de
 * ingredientes, custos e modo de preparo. Conteúdo em pt-BR.
 */
export function buildRecipeHtml(recipe: Recipe): string {
  const ingredientRows = recipe.ingredients
    .map(
      (ing) =>
        `<tr>
          <td>${escapeHtml(ing.materialName)}</td>
          <td class="num">${formatQuantity(ing.quantity)} ${escapeHtml(ing.unit)}</td>
          <td class="num">${formatCurrency(ing.cost)}</td>
        </tr>`,
    )
    .join("");

  const instructions = recipe.instructions?.trim()
    ? `<div class="section">
        <div class="section-title">Modo de preparo</div>
        <div class="instructions">${escapeHtml(recipe.instructions).replace(/\n/g, "<br />")}</div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    @page { size: A4; margin: 16mm; }
    body {
      margin: 0;
      font-family: -apple-system, Roboto, "Segoe UI", sans-serif;
      color: #1f2937;
      background: #ffffff;
    }
    .header { border-bottom: 3px solid #16a34a; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 26px; font-weight: 700; margin: 0; }
    .category { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .yield { font-size: 14px; color: #374151; margin-top: 6px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 6px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
    th { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    .totals { display: flex; gap: 24px; margin-top: 12px; }
    .total-box { flex: 1; background: #f3f4f6; border-radius: 12px; padding: 12px 16px; }
    .total-label { font-size: 12px; color: #6b7280; }
    .total-value { font-size: 20px; font-weight: 700; }
    .total-value.cost { color: #dc2626; }
    .total-value.unit { color: #16a34a; }
    .instructions { font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
    .brand-footer { margin-top: 28px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    .brand-footer a { color: #9ca3af; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${escapeHtml(recipe.name)}</h1>
    <div class="category">${escapeHtml(recipe.category)}</div>
    <div class="yield">Rendimento: ${formatQuantity(recipe.yieldQuantity)} ${escapeHtml(
      recipe.yieldUnit,
    )}</div>
  </div>

  <div class="section">
    <div class="section-title">Ingredientes</div>
    <table>
      <thead>
        <tr><th>Insumo</th><th class="num">Quantidade</th><th class="num">Custo</th></tr>
      </thead>
      <tbody>${ingredientRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="totals">
      <div class="total-box">
        <div class="total-label">Custo total</div>
        <div class="total-value cost">${formatCurrency(recipe.totalCost)}</div>
      </div>
      <div class="total-box">
        <div class="total-label">Custo por unidade</div>
        <div class="total-value unit">${formatCurrency(recipe.costPerUnit)}</div>
      </div>
    </div>
  </div>

  ${instructions}

  <div class="brand-footer"><a href="${playStoreUrl("pdf")}">Feito com Lucro Caseiro</a></div>
</body>
</html>`;
}

/**
 * Gera um PDF da receita e abre a folha de compartilhamento do sistema
 * (salvar em Arquivos, enviar no WhatsApp, imprimir, etc). Reusa a mesma
 * abordagem de `labels` (expo-print + expo-sharing).
 */
export async function exportRecipePdf(recipe: Recipe): Promise<void> {
  const html = buildRecipeHtml(recipe);
  await exportHtmlPdf(html, { dialogTitle: "Imprimir ou compartilhar receita" });
}
