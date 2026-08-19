import { resolveBrand } from "@lucro-caseiro/brands";
import type { FinanceSummary } from "@lucro-caseiro/contracts";
import ExcelJS from "exceljs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import {
  generateFinanceExcel,
  generateFinancePdf,
  getFinanceExportTheme,
} from "./finance.export";

const summary: FinanceSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  fixedExpenses: 0,
  variableExpenses: 0,
  profit: 0,
  period: "2026-08",
};

function pdfContent(pdf: Buffer): string {
  const raw = pdf.toString("latin1");
  return [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)]
    .map((match) => {
      try {
        return inflateSync(Buffer.from(match[1] ?? "", "latin1")).toString();
      } catch {
        return "";
      }
    })
    .join("\n");
}

function pdfRgb(hex: string): string {
  return [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)]
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .join(" ");
}

describe("finance export branding", () => {
  it("aplica a paleta da Revenda ao PDF", async () => {
    const brand = resolveBrand("lucro-revenda");
    const theme = getFinanceExportTheme(brand);

    expect(theme.primary).toBe("#2457C5");
    expect(theme.primaryStrong).toBe("#17304F");

    const pdf = await generateFinancePdf([], summary, brand, "08/2026");
    const content = pdfContent(pdf);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(1_000);
    expect(content).toContain(`${pdfRgb(theme.primaryStrong)} scn`);
    expect(content).toContain(`${pdfRgb(theme.primary)} scn`);
  });

  it("aplica a paleta e o nome da Revenda ao Excel", async () => {
    const brand = resolveBrand("lucro-revenda");
    const buffer = await generateFinanceExcel([], summary, brand, "08/2026");
    const workbook = new ExcelJS.Workbook();
    type ExcelLoadInput = Parameters<typeof workbook.xlsx.load>[0];
    await workbook.xlsx.load(buffer as unknown as ExcelLoadInput);

    expect(workbook.creator).toBe("Lucro na Revenda");
    const headerFill = workbook.getWorksheet("Lançamentos")?.getCell("A4").fill;
    expect(headerFill).toMatchObject({
      type: "pattern",
      fgColor: { argb: "FF2457C5" },
    });
  });
});
