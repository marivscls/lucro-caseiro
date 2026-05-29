import type { FinanceEntry, FinanceSummary } from "@lucro-caseiro/contracts";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const BRAND = "#22C55E";
const INK = "#1F2937";
const MUTED = "#6B7280";
const ZEBRA = "#F3F4F6";
const INCOME = "#16A34A";
const EXPENSE = "#DC2626";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function translateType(type: "income" | "expense"): string {
  return type === "income" ? "Entrada" : "Saída";
}

const CATEGORY_LABELS: Record<string, string> = {
  sale: "Venda",
  material: "Material",
  packaging: "Embalagem",
  transport: "Transporte",
  fee: "Taxa",
  utility: "Conta",
  other: "Outros",
};

function translateCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

const COLS = {
  date: 50,
  type: 120,
  category: 190,
  description: 285,
  value: 445,
};
const VALUE_RIGHT = 545;

export function generateFinancePdf(
  entries: FinanceEntry[],
  summary: FinanceSummary,
  businessName: string,
  period: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header band
    doc.rect(0, 0, doc.page.width, 96).fill(BRAND);
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(businessName, 50, 30);
    doc.font("Helvetica").fontSize(12).text(`Relatório Financeiro · ${period}`, 50, 62);

    // Summary box
    const boxTop = 120;
    doc.roundedRect(50, boxTop, 495, 72, 8).fill(ZEBRA);
    doc
      .fillColor(MUTED)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("RESUMO DO MÊS", 66, boxTop + 12);

    const summaryItems = [
      { label: "Receitas", value: summary.totalIncome, color: INCOME },
      { label: "Despesas", value: summary.totalExpenses, color: EXPENSE },
      {
        label: "Lucro",
        value: summary.profit,
        color: summary.profit >= 0 ? INCOME : EXPENSE,
      },
    ];
    summaryItems.forEach((item, i) => {
      const x = 66 + i * 160;
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(9)
        .text(item.label, x, boxTop + 32);
      doc
        .fillColor(item.color)
        .font("Helvetica-Bold")
        .fontSize(15)
        .text(formatCurrency(item.value), x, boxTop + 44);
    });

    // Table title
    let y = boxTop + 96;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text("Lançamentos", 50, y);
    y += 22;

    // Table header
    doc.rect(50, y - 4, 495, 20).fill(INK);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("Data", COLS.date + 6, y);
    doc.text("Tipo", COLS.type + 6, y);
    doc.text("Categoria", COLS.category + 6, y);
    doc.text("Descrição", COLS.description + 6, y);
    doc.text("Valor", COLS.value, y, {
      width: VALUE_RIGHT - COLS.value - 8,
      align: "right",
    });
    y += 22;

    // Empty state
    if (entries.length === 0) {
      doc
        .fillColor(MUTED)
        .font("Helvetica-Oblique")
        .fontSize(10)
        .text("Nenhum lançamento neste período.", 50, y + 6, {
          width: 495,
          align: "center",
        });
    }

    // Rows
    doc.font("Helvetica").fontSize(9);
    entries.forEach((entry, index) => {
      if (y > 770) {
        doc.addPage();
        y = 50;
      }

      if (index % 2 === 0) {
        doc.rect(50, y - 4, 495, 18).fill(ZEBRA);
      }

      const amountColor = entry.type === "income" ? INCOME : EXPENSE;
      const signed = `${entry.type === "income" ? "+" : "-"} ${formatCurrency(entry.amount)}`;

      doc.fillColor(INK).font("Helvetica");
      doc.text(formatDate(entry.date), COLS.date + 6, y, { width: 64 });
      doc.text(translateType(entry.type), COLS.type + 6, y, { width: 64 });
      doc.text(translateCategory(entry.category), COLS.category + 6, y, { width: 90 });
      doc.text(entry.description, COLS.description + 6, y, {
        width: 150,
        ellipsis: true,
        height: 12,
      });
      doc
        .fillColor(amountColor)
        .font("Helvetica-Bold")
        .text(signed, COLS.value, y, {
          width: VALUE_RIGHT - COLS.value - 8,
          align: "right",
        });

      y += 18;
    });

    // Footer
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text("Gerado pelo Lucro Caseiro", 50, 800, { width: 495, align: "center" });

    doc.fillColor(INK);
    doc.end();
  });
}

export async function generateFinanceExcel(
  entries: FinanceEntry[],
  summary: FinanceSummary,
  period: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lucro Caseiro";

  const currencyFmt = '"R$" #,##0.00';
  const HEADER_BG = "FF22C55E";
  const ZEBRA_BG = "FFF3F4F6";
  const MUTED = "FF6B7280";
  const INK = "FF1F2937";

  const fillSolid = (argb: string): ExcelJS.Fill => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  });
  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFE5E7EB" } },
    left: { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    right: { style: "thin", color: { argb: "FFE5E7EB" } },
  };

  // ---- Sheet 1: Lançamentos ----
  const sheet = workbook.addWorksheet("Lançamentos");
  sheet.properties.defaultRowHeight = 18;
  sheet.columns = [
    { key: "date", width: 16 },
    { key: "type", width: 14 },
    { key: "category", width: 20 },
    { key: "description", width: 46 },
    { key: "amount", width: 18 },
  ];

  sheet.mergeCells("A1:E1");
  const title = sheet.getCell("A1");
  title.value = "Relatório Financeiro";
  title.font = { bold: true, size: 18, color: { argb: INK } };
  title.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 26;

  sheet.mergeCells("A2:E2");
  const subtitle = sheet.getCell("A2");
  subtitle.value = `Período: ${period}`;
  subtitle.font = { color: { argb: MUTED } };

  const HEADER_ROW = 4;
  const headerLabels = ["Data", "Tipo", "Categoria", "Descrição", "Valor"];
  const header = sheet.getRow(HEADER_ROW);
  header.height = 22;
  headerLabels.forEach((label, i) => {
    const cell = header.getCell(i + 1);
    cell.value = label;
    cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    cell.fill = fillSolid(HEADER_BG);
    cell.alignment = { vertical: "middle" };
    cell.border = border;
  });
  sheet.views = [{ state: "frozen", ySplit: HEADER_ROW }];

  if (entries.length === 0) {
    const r = HEADER_ROW + 1;
    sheet.mergeCells(`A${r}:E${r}`);
    const cell = sheet.getCell(`A${r}`);
    cell.value = "Nenhum lançamento neste período.";
    cell.alignment = { horizontal: "center" };
    cell.font = { italic: true, size: 12, color: { argb: MUTED } };
  } else {
    entries.forEach((entry, i) => {
      const income = entry.type === "income";
      const row = sheet.addRow({
        date: formatDate(entry.date),
        type: translateType(entry.type),
        category: translateCategory(entry.category),
        description: entry.description,
        amount: income ? entry.amount : -entry.amount,
      });

      row.eachCell((cell) => {
        cell.border = border;
        cell.font = { size: 12 };
        if (i % 2 === 1) cell.fill = fillSolid(ZEBRA_BG);
      });
      row.getCell("date").alignment = { horizontal: "center" };
      row.getCell("type").alignment = { horizontal: "center" };
      const amountCell = row.getCell("amount");
      amountCell.numFmt = currencyFmt;
      amountCell.alignment = { horizontal: "right" };
      amountCell.font = { size: 12, color: { argb: income ? "FF16A34A" : "FFDC2626" } };
    });
  }

  // ---- Sheet 2: Resumo ----
  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.properties.defaultRowHeight = 18;
  summarySheet.columns = [
    { key: "label", width: 30 },
    { key: "value", width: 22 },
  ];

  summarySheet.mergeCells("A1:B1");
  const sTitle = summarySheet.getCell("A1");
  sTitle.value = "Resumo do mês";
  sTitle.font = { bold: true, size: 18, color: { argb: INK } };
  sTitle.alignment = { vertical: "middle" };
  summarySheet.getRow(1).height = 26;

  summarySheet.mergeCells("A2:B2");
  const sSub = summarySheet.getCell("A2");
  sSub.value = `Período: ${period}`;
  sSub.font = { color: { argb: MUTED } };

  const summaryRows: { label: string; value: number; argb: string; bold?: boolean }[] = [
    { label: "Receita total", value: summary.totalIncome, argb: "FF16A34A" },
    { label: "Despesas total", value: summary.totalExpenses, argb: "FFDC2626" },
    {
      label: "Lucro",
      value: summary.profit,
      argb: summary.profit >= 0 ? "FF16A34A" : "FFDC2626",
      bold: true,
    },
  ];
  summaryRows.forEach((r, i) => {
    const row = summarySheet.getRow(HEADER_ROW + i);
    const labelCell = row.getCell(1);
    labelCell.value = r.label;
    labelCell.font = { bold: r.bold ?? false, size: 12, color: { argb: INK } };
    labelCell.border = border;
    const valueCell = row.getCell(2);
    valueCell.value = r.value;
    valueCell.numFmt = currencyFmt;
    valueCell.alignment = { horizontal: "right" };
    valueCell.font = { bold: r.bold ?? false, size: 12, color: { argb: r.argb } };
    valueCell.border = border;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
