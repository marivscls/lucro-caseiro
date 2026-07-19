import { getActiveBrand } from "@lucro-caseiro/brands";
import type { LabelData } from "@lucro-caseiro/contracts";

import { getBrandDisplayName } from "../../shared/brand-name";
import { showAlert } from "../../shared/components/alert-store";
import { exportHtmlPdf } from "../../shared/utils/export-html";
import { resolveLabelStyle } from "./components/label-preview";
import { isoToBR } from "./dates";
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
  return `<div class="date"><strong>${label}</strong><span>${escapeHtml(isoToBR(value))}</span></div>`;
}

function textLine(value: string | undefined, className?: string): string {
  if (!value?.trim()) return "";
  const cls = className ? ` class="${className}"` : "";
  return `<div${cls}>${escapeHtml(value)}</div>`;
}

function buildLabelCard(
  data: LabelData,
  logoUrl?: string | null,
  qrUrl?: string | null,
): string {
  const brandName = getBrandDisplayName(getActiveBrand());
  const logo = logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}" />` : "";
  const note = data.note?.trim()
    ? `<div class="note">${escapeHtml(data.note)}</div>`
    : "";
  const dates =
    data.manufacturingDate?.trim() || data.expirationDate?.trim()
      ? `<div class="dates">
        ${dateBlock("Feito em", data.manufacturingDate)}
        ${dateBlock("Validade", data.expirationDate)}
      </div>`
      : "";
  const producer =
    data.producerName?.trim() || data.producerPhone?.trim()
      ? `<div class="producer">
        ${textLine(data.producerName, "producer-name")}
        ${textLine(data.producerPhone)}
      </div>`
      : "";
  const qr = qrUrl
    ? `<div class="qr">${buildQrSvg(qrUrl)}<div>Veja no catálogo</div></div>`
    : "";

  return `${logo}
    <div class="title">${escapeHtml(data.productName || "Produto")}</div>
    ${note}
    ${dates}
    ${producer}
    ${qr}
    <div class="brand-credit">Feito com ${escapeHtml(brandName)}</div>`;
}

export function buildLabelHtml(
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
  const scale = sheet ? 1 : 1.35;
  const size = (value: number) => Math.round(value * scale);

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
      min-height: ${sheet ? "160px" : "240px"};
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${style.bg};
      border: ${borderCss};
      border-radius: ${radiusCss};
      padding: ${size(22)}px;
      color: ${style.accent};
      text-align: center;
    }
    .logo {
      width: ${size(58)}px;
      height: ${size(58)}px;
      object-fit: contain;
      margin-bottom: ${size(12)}px;
      border-radius: 8px;
    }
    .title {
      font-size: ${size(24)}px;
      font-weight: 700;
      line-height: 1.15;
    }
    .note {
      margin-top: ${size(8)}px;
      font-size: ${size(12)}px;
      line-height: 1.35;
    }
    .dates {
      display: flex;
      justify-content: center;
      gap: ${size(28)}px;
      margin-top: ${size(12)}px;
    }
    .date { display: flex; flex-direction: column; font-size: ${size(11)}px; }
    .producer {
      width: 100%;
      border-top: 1px solid ${style.border};
      padding-top: ${size(10)}px;
      margin-top: ${size(12)}px;
      font-size: ${size(11)}px;
    }
    .producer-name { font-weight: 700; }
    .qr { margin-top: ${size(10)}px; font-size: ${size(9)}px; }
    .qr svg { width: ${size(68)}px; height: ${size(68)}px; }
    .brand-credit { margin-top: ${size(8)}px; font-size: ${size(8)}px; opacity: 0.45; }
  </style>
</head>
<body>${cards}</body>
</html>`;
}

function labelFileName(productName?: string): string {
  const slug = (productName ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `etiqueta-${slug || "produto"}.pdf`;
}

export async function exportLabelPdf(
  data: LabelData,
  templateId: string,
  logoUrl?: string | null,
  qrUrl?: string | null,
  copies = 1,
): Promise<void> {
  const html = buildLabelHtml(data, templateId, logoUrl, qrUrl, copies);
  await exportHtmlPdf(html, {
    dialogTitle: "Baixar ou compartilhar etiqueta",
    filename: labelFileName(data.productName),
  });
}

const SHEET_COPIES = 8;

function confirmLabelResponsibility(): Promise<boolean> {
  return new Promise((resolve) => {
    showAlert({
      title: "Confira antes de imprimir",
      message:
        "Esta é uma etiqueta de identificação e não substitui a rotulagem obrigatória quando aplicável. Confira o nome, as datas e a observação.",
      buttons: [
        { text: "Voltar e revisar", style: "cancel", onPress: () => resolve(false) },
        { text: "Continuar", onPress: () => resolve(true) },
      ],
    });
  });
}

function chooseLabelCopies(
  data: LabelData,
  templateId: string,
  logoUrl?: string | null,
  qrUrl?: string | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    showAlert({
      title: "Baixar etiqueta",
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

export async function exportLabelPdfWithChoice(
  data: LabelData,
  templateId: string,
  logoUrl?: string | null,
  qrUrl?: string | null,
): Promise<void> {
  const confirmed = await confirmLabelResponsibility();
  if (!confirmed) return;
  await chooseLabelCopies(data, templateId, logoUrl, qrUrl);
}
