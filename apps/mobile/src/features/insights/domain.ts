import type { MonthlyRevenue } from "@lucro-caseiro/contracts";

import { formatIntBR } from "../../shared/utils/format";

export { formatCurrency as formatMoney } from "../../shared/utils/format";

/** Versão curta para eixos/labels (sem centavos). Ex.: "R$ 1.200", "R$ 15,5 mil". */
export function formatMoneyShort(value: number): string {
  if (value >= 10_000) {
    return `R$ ${(value / 1000).toFixed(1).replace(".", ",")} mil`;
  }
  return `R$ ${formatIntBR(value)}`;
}

const MONTH_ABBR = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "2026-05" -> "mai". */
export function monthLabel(key: string): string {
  const month = Number(key.split("-")[1]);
  return MONTH_ABBR[month - 1] ?? key;
}

/** Variação % do último mês vs o anterior; null quando não dá pra comparar. */
export function monthOverMonthDelta(series: MonthlyRevenue[]): number | null {
  if (series.length < 2) return null;
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  if (!current || !previous || previous.revenue <= 0) return null;
  return ((current.revenue - previous.revenue) / previous.revenue) * 100;
}

/** Maior receita da série (>= 1 para evitar divisão por zero ao calcular alturas). */
export function maxRevenue(series: MonthlyRevenue[]): number {
  return Math.max(1, ...series.map((m) => m.revenue));
}
