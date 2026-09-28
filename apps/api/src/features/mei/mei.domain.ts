import {
  MEI_ANNUAL_REVENUE_LIMIT,
  meiStatus,
  type MeiActivity,
  type MeiSummary,
} from "@lucro-caseiro/contracts";

const round = (value: number) => Math.round(value * 100) / 100;

/** Ano e mês de hoje no fuso de Brasília (a virada do mês é a do Brasil). */
export function currentYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month") };
}

/**
 * Resumo do MEI a partir das entradas de cada mês do ano (janeiro até o último
 * mês já começado). A projeção usa a média dos meses fechados mais o atual.
 */
export function buildMeiSummary(input: {
  year: number;
  month: number;
  activity: MeiActivity | null;
  monthlyIncome: number[];
  limit?: number;
}): MeiSummary {
  const limit = input.limit ?? MEI_ANNUAL_REVENUE_LIMIT;
  const months = input.monthlyIncome.map((revenue, index) => ({
    month: index + 1,
    revenue: round(revenue),
  }));
  const yearRevenue = round(months.reduce((sum, row) => sum + row.revenue, 0));
  const monthRevenue = months[input.month - 1]?.revenue ?? 0;
  const elapsed = Math.max(1, months.length);
  const projectedYearRevenue = round((yearRevenue / elapsed) * 12);
  return {
    year: input.year,
    month: input.month,
    activity: input.activity,
    monthRevenue,
    yearRevenue,
    annualLimit: limit,
    usedRatio: limit > 0 ? Math.round((yearRevenue / limit) * 1000) / 1000 : 0,
    remaining: round(Math.max(0, limit - yearRevenue)),
    projectedYearRevenue,
    status: meiStatus(yearRevenue, limit),
    months,
  };
}
