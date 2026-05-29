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
    doc.text("Valor", COLS.value, y, { width: VALUE_RIGHT - COLS.value, align: "right" });
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
        .text(signed, COLS.value, y, { width: VALUE_RIGHT - COLS.value, align: "right" });

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
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF22C55E" },
  };

  // Sheet 1: Lançamentos
  const entriesSheet = workbook.addWorksheet("Lançamentos", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  entriesSheet.columns = [
    { header: "Data", key: "date", width: 14 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Descrição", key: "description", width: 38 },
    { header: "Valor", key: "amount", width: 16 },
  ];

  const headerRow = entriesSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = headerFill;
  headerRow.alignment = { vertical: "middle" };

  for (const entry of entries) {
    const row = entriesSheet.addRow({
      date: formatDate(entry.date),
      type: translateType(entry.type),
      category: translateCategory(entry.category),
      description: entry.description,
      amount: entry.type === "income" ? entry.amount : -entry.amount,
    });

    const amountCell = row.getCell("amount");
    amountCell.numFmt = currencyFmt;
    amountCell.font = {
      color: { argb: entry.type === "income" ? "FF16A34A" : "FFDC2626" },
    };
  }

  if (entries.length === 0) {
    entriesSheet.addRow({ description: "Nenhum lançamento neste período." });
  }

  // Sheet 2: Resumo
  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.columns = [
    { header: "Descrição", key: "label", width: 26 },
    { header: "Valor", key: "value", width: 20 },
  ];

  const summaryHeader = summarySheet.getRow(1);
  summaryHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  summaryHeader.fill = headerFill;

  summarySheet.addRow({ label: "Período", value: period });

  const rows: { label: string; value: number; argb: string; bold?: boolean }[] = [
    { label: "Receita total", value: summary.totalIncome, argb: "FF16A34A" },
    { label: "Despesas total", value: summary.totalExpenses, argb: "FFDC2626" },
    {
      label: "Lucro",
      value: summary.profit,
      argb: summary.profit >= 0 ? "FF16A34A" : "FFDC2626",
      bold: true,
    },
  ];
  for (const r of rows) {
    const row = summarySheet.addRow({ label: r.label, value: r.value });
    const valueCell = row.getCell("value");
    valueCell.numFmt = currencyFmt;
    valueCell.font = { bold: r.bold ?? false, color: { argb: r.argb } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
