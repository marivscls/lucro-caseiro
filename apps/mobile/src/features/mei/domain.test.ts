import type { MeiSummary } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  ceilingMessage,
  dasReminderText,
  meiReportLines,
  meiReportText,
  monthLabel,
  nextDasDueDate,
  projectionWarning,
  shiftMonth,
} from "./domain";

function summary(overrides: Partial<MeiSummary> = {}): MeiSummary {
  return {
    year: 2026,
    month: 9,
    activity: "industry",
    monthRevenue: 5000,
    yearRevenue: 40000,
    annualLimit: 81000,
    usedRatio: 40000 / 81000,
    remaining: 41000,
    projectedYearRevenue: 53333.33,
    status: "ok",
    months: [],
    ...overrides,
  };
}

describe("mei domain", () => {
  it("põe as entradas do mês na atividade escolhida", () => {
    const lines = meiReportLines("industry", 5000, 1200);
    const industry = lines.find((line) => line.activity === "industry");
    expect(industry).toMatchObject({
      withInvoice: 1200,
      withoutInvoice: 3800,
      total: 5000,
    });
    expect(lines.find((line) => line.activity === "commerce")?.total).toBe(0);
  });

  it("nota fiscal nunca passa do total do mês", () => {
    const [, industry] = meiReportLines("industry", 100, 500);
    expect(industry).toMatchObject({ withInvoice: 100, withoutInvoice: 0 });
  });

  it("monta o relatório em texto", () => {
    const text = meiReportText(summary(), "industry", 0, "Ateliê da Ana");
    expect(text).toContain("Setembro de 2026");
    expect(text).toContain("Total geral do mês: R$ 5.000,00");
  });

  it("explica o teto em cada situação", () => {
    expect(ceilingMessage(summary())).toContain("Tudo tranquilo");
    expect(
      ceilingMessage(summary({ status: "near", usedRatio: 0.85, remaining: 12150 })),
    ).toContain("85%");
    expect(ceilingMessage(summary({ status: "over", yearRevenue: 90000 }))).toContain(
      "R$ 9.000,00",
    );
  });

  it("avisa quando a projeção passa do teto", () => {
    expect(projectionWarning(summary())).toBeNull();
    expect(projectionWarning(summary({ projectedYearRevenue: 90000 }))).toContain(
      "acima do teto",
    );
  });

  it("navega entre meses sem passar de hoje", () => {
    const today = { year: 2026, month: 9 };
    expect(shiftMonth({ year: 2026, month: 1 }, -1, today)).toEqual({
      year: 2025,
      month: 12,
    });
    expect(shiftMonth(today, 1, today)).toBeNull();
    expect(monthLabel(2026, 3)).toBe("Março de 2026");
  });

  it("calcula o próximo DAS", () => {
    expect(nextDasDueDate(new Date(2026, 8, 15)).getDate()).toBe(20);
    expect(nextDasDueDate(new Date(2026, 8, 21)).getMonth()).toBe(9);
    expect(dasReminderText(new Date(2026, 8, 19))).toContain("amanhã");
  });
});
