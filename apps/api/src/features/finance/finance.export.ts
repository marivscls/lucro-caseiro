import type { FinanceEntry, FinanceSummary } from "@lucro-caseiro/contracts";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function translateType(type: "income" | "expense"): string {
  return type === "income" ? "Entrada" : "Saida";
}

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

    // Header
    doc.fontSize(20).text(businessName, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).text("Relatorio Financeiro", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(11).text(`Periodo: ${period}`, { align: "center" });
    doc.moveDown(1.5);

    // Summary section
    doc.fontSize(14).text("Resumo", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc
      .fillColor("#16a34a")
      .text(`Receita total: ${formatCurrency(summary.totalIncome)}`);
    doc
      .fillColor("#dc2626")
      .text(`Despesas total: ${formatCurrency(summary.totalExpenses)}`);
    const profitColor = summary.profit >= 0 ? "#16a34a" : "#dc2626";
    doc.fillColor(profitColor).text(`Lucro: ${formatCurrency(summary.profit)}`);
    doc.fillColor("#000000");
    doc.moveDown(1.5);

    // Table header
    doc.fontSize(14).text("Lancamentos", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colX = [50, 120, 190, 290, 430];
    const colHeaders = ["Data", "Tipo", "Categoria", "Descricao", "Valor"];

    doc.fontSize(10).font("Helvetica-Bold");
    colHeaders.forEach((header, i) => {
      doc.text(header, colX[i], tableTop, { width: 100 });
    });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke();

    // Table rows
    doc.font("Helvetica").fontSize(9);
    let y = tableTop + 22;

    for (const entry of entries) {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }

      const color = entry.type === "income" ? "#16a34a" : "#dc2626";
      doc.fillColor(color);

      doc.text(formatDate(entry.date), colX[0], y, { width: 65 });
      doc.text(translateType(entry.type), colX[1], y, { width: 65 });
      doc.text(entry.category, colX[2], y, { width: 95 });
      doc.text(entry.description, colX[3], y, { width: 135 });
      doc.text(formatCurrency(entry.amount), colX[4], y, { width: 100 });

      y += 18;
    }

    doc.fillColor("#000000");
    doc.end();
  });
}

export async function generateFinanceExcel(
  entries: FinanceEntry[],
  summary: FinanceSummary,
  period: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Lancamentos
  const entriesSheet = workbook.addWorksheet("Lancamentos");
  entriesSheet.columns = [
    { header: "Data", key: "date", width: 14 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Descricao", key: "description", width: 35 },
    { header: "Valor", key: "amount", width: 16 },
  ];

  // Bold header
  entriesSheet.getRow(1).font = { bold: true };

  for (const entry of entries) {
    const row = entriesSheet.addRow({
      date: formatDate(entry.date),
      type: translateType(entry.type),
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
    });

    // Format amount as currency
    const amountCell = row.getCell("amount");
    amountCell.numFmt = '#,##0.00"";-#,##0.00""';

    // Color rows
    const color = entry.type === "income" ? "16a34a" : "dc2626";
    row.eachCell((cell) => {
      cell.font = { color: { argb: `FF${color}` } };
    });
  }

  // Sheet 2: Resumo
  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.columns = [
    { header: "Descricao", key: "label", width: 25 },
    { header: "Valor", key: "value", width: 20 },
  ];

  summarySheet.getRow(1).font = { bold: true };

  summarySheet.addRow({ label: `Periodo: ${period}`, value: "" });
  summarySheet.addRow({ label: "" });

  const incomeRow = summarySheet.addRow({
    label: "Receita Total",
    value: summary.totalIncome,
  });
  incomeRow.getCell("value").numFmt = '#,##0.00"";-#,##0.00""';
  incomeRow.getCell("value").font = { color: { argb: "FF16a34a" } };

  const expensesRow = summarySheet.addRow({
    label: "Despesas Total",
    value: summary.totalExpenses,
  });
  expensesRow.getCell("value").numFmt = '#,##0.00"";-#,##0.00""';
  expensesRow.getCell("value").font = { color: { argb: "FFdc2626" } };

  const profitRow = summarySheet.addRow({
    label: "Lucro",
    value: summary.profit,
  });
  profitRow.getCell("value").numFmt = '#,##0.00"";-#,##0.00""';
  const profitArgb = summary.profit >= 0 ? "FF16a34a" : "FFdc2626";
  profitRow.getCell("value").font = { bold: true, color: { argb: profitArgb } };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
