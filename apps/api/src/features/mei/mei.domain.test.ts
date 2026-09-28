import { describe, expect, it } from "vitest";

import { buildMeiSummary, currentYearMonth } from "./mei.domain";

describe("buildMeiSummary", () => {
  it("soma o ano, projeta pela média e marca tranquilo abaixo de 80%", () => {
    const summary = buildMeiSummary({
      year: 2026,
      month: 3,
      activity: "industry",
      monthlyIncome: [4000, 5000, 3000.5],
    });
    expect(summary).toMatchObject({
      monthRevenue: 3000.5,
      yearRevenue: 12000.5,
      annualLimit: 81000,
      remaining: 68999.5,
      projectedYearRevenue: 48002,
      status: "ok",
    });
    expect(summary.months).toHaveLength(3);
  });

  it("avisa perto do teto a partir de 80% e quando passa", () => {
    expect(
      buildMeiSummary({ year: 2026, month: 1, activity: null, monthlyIncome: [64800] })
        .status,
    ).toBe("near");
    const over = buildMeiSummary({
      year: 2026,
      month: 1,
      activity: null,
      monthlyIncome: [82000],
    });
    expect(over.status).toBe("over");
    expect(over.remaining).toBe(0);
  });
});

describe("currentYearMonth", () => {
  it("usa o fuso de Brasília na virada do mês", () => {
    expect(currentYearMonth(new Date("2026-10-01T02:00:00Z"))).toEqual({
      year: 2026,
      month: 9,
    });
  });
});
