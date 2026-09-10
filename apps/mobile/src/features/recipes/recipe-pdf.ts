import type { Recipe } from "@lucro-caseiro/contracts";
import { getActiveBrand } from "@lucro-caseiro/brands";

import { getBrandDisplayName } from "../../shared/brand-name";
import { displayIngredientName } from "../../shared/ingredient-image/resolve";
import { exportHtmlPdf } from "../../shared/utils/export-html";
import { formatCurrency } from "../../shared/utils/format";
import { MANROPE_HTML_HEAD } from "../../shared/utils/manrope-html";
import { DOCUMENT_PDF_CSS } from "../../shared/utils/document-pdf";
import { playStoreUrl } from "../../shared/utils/store-link";

export interface RecipePdfCopy {
  readonly formulaNoun: string;
  readonly materialNoun: string;
  readonly materialNounPlural: string;
  readonly quantityLabel: string;
}

const DEFAULT_PDF_COPY: RecipePdfCopy = {
  formulaNoun: "ficha de custo",
  materialNoun: "material",
  materialNounPlural: "materiais",
  quantityLabel: "Quantidade final",
};

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
export function buildRecipeHtml(
  recipe: Recipe,
  copy: RecipePdfCopy = DEFAULT_PDF_COPY,
): string {
  const brandName = getBrandDisplayName(getActiveBrand());
  const ingredientRows = recipe.ingredients
    .map(
      (ing) =>
        `<tr>
          <td>${escapeHtml(displayIngredientName(ing.materialName))}</td>
          <td class="num">${formatQuantity(ing.quantity)} ${escapeHtml(ing.unit)}</td>
          <td class="num">${formatCurrency(ing.cost)}</td>
        </tr>`,
    )
    .join("");

  const instructions = recipe.instructions?.trim()
    ? `<div class="section">
        <div class="section-title">Etapas ou observações</div>
        <div class="instructions">${escapeHtml(recipe.instructions).replace(/\n/g, "<br />")}</div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(displayIngredientName(recipe.name))} · ${escapeHtml(copy.formulaNoun)}</title>
${MANROPE_HTML_HEAD}
<style>
${DOCUMENT_PDF_CSS}
@page { size: A4 portrait; margin: 16mm; }
</style>
</head>
<body>
<main class="recipe-page">
  <header class="head">
    <div class="brand">
      <div class="eyebrow">${escapeHtml(copy.formulaNoun)}</div>
    <h1 class="title">${escapeHtml(displayIngredientName(recipe.name))}</h1>
    </div>
  </header>
  <div class="meta">
    <div class="meta-row"><span>Categoria</span><strong>${escapeHtml(recipe.category)}</strong></div>
    <div class="meta-row"><span>${escapeHtml(copy.quantityLabel)}</span><strong>${formatQuantity(recipe.yieldQuantity)} ${escapeHtml(recipe.yieldUnit)}</strong></div>
  </div>

  <div class="section">
    <div class="section-title">${escapeHtml(
      copy.materialNounPlural.replace(/^./, (letter) => letter.toUpperCase()),
    )}</div>
    <table>
      <thead>
        <tr><th scope="col">${escapeHtml(copy.materialNoun)}</th><th scope="col" class="num">Quantidade</th><th scope="col" class="num">Custo</th></tr>
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

  <footer>
    <p>${escapeHtml(copy.formulaNoun.replace(/^./, (letter) => letter.toUpperCase()))}</p>
    <div class="brand-footer"><a href="${playStoreUrl("pdf")}">Feito com ${escapeHtml(brandName)}</a></div>
  </footer>
</main>
</body>
</html>`;
}

/**
 * Gera um PDF da receita e abre a folha de compartilhamento do sistema
 * (salvar em Arquivos, enviar no WhatsApp, imprimir, etc). Reusa a mesma
 * abordagem de `labels` (expo-print + expo-sharing).
 */
export async function exportRecipePdf(
  recipe: Recipe,
  copy: RecipePdfCopy = DEFAULT_PDF_COPY,
): Promise<void> {
  const html = buildRecipeHtml(recipe, copy);
  await exportHtmlPdf(html, {
    dialogTitle: `Imprimir ou compartilhar ${copy.formulaNoun}`,
  });
}
