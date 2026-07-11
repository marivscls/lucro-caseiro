import * as FileSystem from "expo-file-system/legacy";

import type { LabelData } from "@lucro-caseiro/contracts";

import { showAlert } from "../../shared/components/alert-store";
import { resolveLabelStyle } from "./components/label-preview";
import { isoToBR } from "./dates";
import { NUTRITION_FIELDS, hasNutrition } from "./nutrition";
import { buildQrSvg } from "./qr";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dateBlock(label: string, value?: string): string {
  if (!value?.trim()) return "";
  return `<div><div class="label">${label}</div><div class="value">${escapeHtml(value)}</div></div>`;
}

function textLine(value: string | undefined, className?: string): string {
  if (!value?.trim()) return "";
  const cls = className ? ` class="${className}"` : "";
  return `<div${cls}>${escapeHtml(value)}</div>`;
}

/** Conteúdo interno do card do rótulo (sem o wrapper `.label-card`). */
function buildLabelCard(
  data: LabelData,
  logoUrl?: string | null,
  qrUrl?: string | null,
): string {
  const logo = logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}" />` : "";
  const qr = qrUrl ? `<div class="qr">${buildQrSvg(qrUrl)}</div>` : "";

  let ingredients = "";
  if (data.ingredients?.trim()) {
    ingredients = `<div class="block">
        <div class="label">Ingredientes:</div>
        <div class="value">${escapeHtml(data.ingredients)}</div>
      </div>`;
  }

  let dates = "";
  if (data.manufacturingDate?.trim() || data.expirationDate?.trim()) {
    dates = `<div class="dates">
          ${dateBlock("Fabricação", isoToBR(data.manufacturingDate))}
          ${dateBlock("Validade", isoToBR(data.expirationDate))}
        </div>`;
  }

  let nutrition = "";
  if (hasNutrition(data.nutrition)) {
    const rows = NUTRITION_FIELDS.filter((f) => data.nutrition?.[f.key]?.trim())
      .map(
        (f) =>
          `<tr><td>${f.label}</td><td class="v">${escapeHtml(
            data.nutrition?.[f.key] ?? "",
          )}</td></tr>`,
      )
      .join("");
    nutrition = `<div class="nutrition"><div class="nutrition-title">Informação nutricional</div><table>${rows}</table></div>`;
  }

  let producer = "";
  if (data.producerName?.trim() || data.producerPhone?.trim()) {
    producer = `<div class="producer">
          ${textLine(data.producerName)}
          ${textLine(data.producerPhone, "phone")}
        </div>`;
  }

  return `${logo}
    <div class="title">${escapeHtml(data.productName || "Produto")}</div>
    ${ingredients}
    ${nutrition}
    ${dates}
    ${producer}
    ${qr}
    <div class="brand-credit">Lucro Caseiro</div>`;
}

function buildLabelHtml(
  data: LabelData,
  templateId: string,
  logoUrl?: string | null,
  qrUrl?: string | null,
  copies = 1,
): string {
  const style = resolveLabelStyle(templateId, data.style);
  const borderCss =
    style.borderStyle === "none" ? "none" : `2px ${style.borderStyle} ${style.border}`;
  const radiusCss = style.corner === "square" ? "0" : "12px";
  const count = Math.max(1, Math.floor(copies));
  const card = buildLabelCard(data, logoUrl, qrUrl);
  const cards = `<div class="label-card">${card}</div>`.repeat(count);
  const sheet = count > 1;
  // Etiqueta única fica maior pra aproveitar a folha A4 (a folha cheia já usa 2 colunas).
  const scale = sheet ? 1 : 1.4;
  const sz = (n: number) => Math.round(n * scale);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    @page { size: A4; margin: 10mm; }
    body {
      margin: 0;
      padding: ${sheet ? "0" : "24px"};
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      align-items: flex-start;
      font-family: ${style.font};
      background: #ffffff;
    }
    .label-card {
      width: ${sheet ? "47%" : "460px"};
      break-inside: avoid;
      background: ${style.bg};
      border: ${borderCss};
      border-radius: ${radiusCss};
      padding: ${sz(24)}px;
      color: ${style.accent};
    }
    .logo {
      display: block;
      width: ${sz(64)}px;
      height: ${sz(64)}px;
      object-fit: contain;
      margin: 0 auto ${sz(18)}px;
      border-radius: 8px;
    }
    .title {
      text-align: center;
      font-size: ${sz(24)}px;
      font-weight: 700;
      margin: 0 0 ${sz(16)}px;
    }
    .block { margin-bottom: ${sz(12)}px; }
    .label { font-size: ${sz(12)}px; font-weight: 700; }
    .value { font-size: ${sz(12)}px; line-height: 1.4; }
    .dates {
      display: flex;
      justify-content: space-between;
      gap: ${sz(16)}px;
      margin-bottom: ${sz(12)}px;
    }
    .producer {
      border-top: 1px solid ${style.border};
      padding-top: ${sz(12)}px;
      margin-top: ${sz(6)}px;
      text-align: center;
      font-size: ${sz(13)}px;
    }
    .producer .phone { font-size: ${sz(12)}px; }
    .nutrition {
      border: 1px solid ${style.accent};
      border-radius: 8px;
      padding: ${sz(8)}px ${sz(10)}px;
      margin-bottom: ${sz(12)}px;
    }
    .nutrition-title { font-size: ${sz(12)}px; font-weight: 700; margin-bottom: 4px; }
    .nutrition table { width: 100%; border-collapse: collapse; }
    .nutrition td { font-size: ${sz(11)}px; padding: 1px 0; }
    .nutrition td.v { text-align: right; font-weight: 700; }
    .qr {
      margin-top: ${sz(12)}px;
      text-align: center;
    }
    .qr svg {
      width: ${sz(96)}px;
      height: ${sz(96)}px;
    }
    .brand-credit {
      margin-top: ${sz(8)}px;
      text-align: center;
      font-size: ${sz(8)}px;
      opacity: 0.45;
    }
  </style>
</head>
<body>
  ${cards}
</body>
</html>`;
}

/** Nome de arquivo amigável a partir do nome do produto (sem acento/símbolo). */
function labelFileName(productName?: string): string {
  const slug = (productName ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `rotulo-${slug || "produto"}.pdf`;
}

/**
 * Gera um PDF do rotulo e abre a folha de compartilhamento do sistema
 * (salvar em Arquivos, enviar no WhatsApp, imprimir, etc).
 */
export async function exportLabelPdf(
  data: LabelData,
  templateId: string,
  logoUrl?: string | null,
  qrUrl?: string | null,
  copies = 1,
): Promise<void> {
  const html = buildLabelHtml(data, templateId, logoUrl, qrUrl, copies);
  const [Print, Sharing] = await Promise.all([
    import("expo-print"),
    import("expo-sharing"),
  ]);
  const { uri } = await Print.printToFileAsync({ html });

  // printToFileAsync gera um nome tipo "<uuid>.pdf"; copia pra um nome legível
  // (ex.: "rotulo-brigadeiro-gourmet.pdf") antes de compartilhar. Se a cópia
  // falhar, compartilha o original — não bloqueia o download.
  let shareUri = uri;
  try {
    const dest = `${FileSystem.cacheDirectory}${labelFileName(data.productName)}`;
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: uri, to: dest });
    shareUri = dest;
  } catch {
    shareUri = uri;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      mimeType: "application/pdf",
      dialogTitle: "Baixar ou compartilhar rótulo",
      UTI: "com.adobe.pdf",
    });
    return;
  }

  // Fallback: abre o dialogo de impressao nativo (inclui "Salvar como PDF").
  await Print.printAsync({ html });
}

const SHEET_COPIES = 8;

/**
 * Pergunta se quer 1 etiqueta ou uma folha cheia e gera o PDF correspondente.
 * Resolve ao concluir/cancelar; rejeita em erro real (caller mostra o aviso).
 */
export function exportLabelPdfWithChoice(
  data: LabelData,
  templateId: string,
  logoUrl?: string | null,
  qrUrl?: string | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    showAlert({
      title: "Baixar rótulo",
      message: "Quantas etiquetas no PDF?",
      buttons: [
        {
          text: "1 etiqueta",
          onPress: () => {
            exportLabelPdf(data, templateId, logoUrl, qrUrl, 1).then(resolve, reject);
          },
        },
        {
          text: `Folha cheia (${SHEET_COPIES})`,
          onPress: () => {
            exportLabelPdf(data, templateId, logoUrl, qrUrl, SHEET_COPIES).then(
              resolve,
              reject,
            );
          },
        },
        { text: "Cancelar", style: "cancel", onPress: () => resolve() },
      ],
    });
  });
}
