import type { MonthlyRevenue } from "@lucro-caseiro/contracts";

export function formatMoney(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/** Versão curta para eixos/labels (sem centavos). Ex.: "R$ 1,2 mil", "R$ 350". */
export function formatMoneyShort(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace(".", ",")} mil`;
  }
  return `R$ ${Math.round(value)}`;
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

/** Maior receita da série (>= 1 para evitar divisão por zero ao calcular alturas). */
export function maxRevenue(series: MonthlyRevenue[]): number {
  return Math.max(1, ...series.map((m) => m.revenue));
}
