import type { LabelData } from "@lucro-caseiro/contracts";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { TEMPLATE_STYLES } from "./components/label-preview";
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

function buildLabelHtml(
  data: LabelData,
  templateId: string,
  logoUrl?: string | null,
  qrUrl?: string | null,
): string {
  const style = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES.classico;

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
          ${dateBlock("Fabricação", data.manufacturingDate)}
          ${dateBlock("Validade", data.expirationDate)}
        </div>`;
  }

  let producer = "";
  if (data.producerName?.trim() || data.producerPhone?.trim()) {
    producer = `<div class="producer">
          ${textLine(data.producerName)}
          ${textLine(data.producerPhone, "phone")}
        </div>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      font-family: ${style.font};
      background: #ffffff;
    }
    .label-card {
      width: 320px;
      background: ${style.bg};
      border: 3px solid ${style.border};
      border-radius: 16px;
      padding: 24px;
      color: ${style.accent};
    }
    .logo {
      display: block;
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin: 0 auto 12px;
      border-radius: 8px;
    }
    .title {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 14px;
    }
    .block { margin-bottom: 12px; }
    .label { font-size: 12px; font-weight: 700; }
    .value { font-size: 12px; line-height: 1.4; }
    .dates {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }
    .producer {
      border-top: 1px solid ${style.border};
      padding-top: 10px;
      margin-top: 6px;
      text-align: center;
      font-size: 13px;
    }
    .producer .phone { font-size: 12px; }
    .qr {
      margin-top: 12px;
      text-align: center;
    }
    .qr svg {
      width: 96px;
      height: 96px;
    }
  </style>
</head>
<body>
  <div class="label-card">
    ${logo}
    <div class="title">${escapeHtml(data.productName || "Produto")}</div>
    ${ingredients}
    ${dates}
    ${producer}
    ${qr}
  </div>
</body>
</html>`;
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
): Promise<void> {
  const html = buildLabelHtml(data, templateId, logoUrl, qrUrl);
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Baixar ou compartilhar rótulo",
      UTI: "com.adobe.pdf",
    });
    return;
  }

  // Fallback: abre o dialogo de impressao nativo (inclui "Salvar como PDF").
  await Print.printAsync({ html });
}
