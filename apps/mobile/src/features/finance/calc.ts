/**
 * Cálculos puros do painel financeiro (cliente).
 * `profit` espelha o `calculateProfit` do backend (finance.domain.ts).
 */

/** Lucro do período = receitas − despesas. */
export function profit(income: number, expenses: number): number {
  return income - expenses;
}

/**
 * Variação % do lucro vs. período anterior. Retorna `null` quando o lucro
 * anterior é 0 (sem base de comparação / evita divisão por zero).
 */
export function profitDeltaPct(currentProfit: number, prevProfit: number): number | null {
  if (prevProfit === 0) return null;
  return Math.round(((currentProfit - prevProfit) / Math.abs(prevProfit)) * 100);
}

/** Conta lançamentos por tipo (receita/despesa). */
export function countByType(entries: ReadonlyArray<{ type: string }>): {
  incomeCount: number;
  expenseCount: number;
} {
  let incomeCount = 0;
  let expenseCount = 0;
  for (const entry of entries) {
    if (entry.type === "income") incomeCount += 1;
    else if (entry.type === "expense") expenseCount += 1;
  }
  return { incomeCount, expenseCount };
}

/** "week" = semana atual (segunda a domingo), o período do plano Gratuito. */
export type FinancePeriod = "today" | "7days" | "week" | "month";

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Semana atual de segunda a domingo (datas locais, inclusivas). É o que o
 * Financeiro do plano Gratuito mostra; o backend aplica o mesmo recorte.
 */
export function currentWeekRange(today = new Date()): {
  startDate: string;
  endDate: string;
} {
  // getDay(): domingo = 0. Dias desde a segunda: seg = 0 ... dom = 6.
  const sinceMonday = (today.getDay() + 6) % 7;
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - sinceMonday,
  );
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

/** Rótulo curto da semana: "10 a 16 de nov." ou "28 de out. a 3 de nov.". */
export function weekRangeLabel(range: { startDate: string; endDate: string }): string {
  const [, startMonth, startDay] = range.startDate.split("-").map(Number);
  const [, endMonth, endDay] = range.endDate.split("-").map(Number);
  const months = [
    "jan.",
    "fev.",
    "mar.",
    "abr.",
    "maio",
    "jun.",
    "jul.",
    "ago.",
    "set.",
    "out.",
    "nov.",
    "dez.",
  ];
  if (startMonth === endMonth) {
    return `${startDay} a ${endDay} de ${months[endMonth - 1]}`;
  }
  return `${startDay} de ${months[startMonth - 1]} a ${endDay} de ${months[endMonth - 1]}`;
}

/** Intervalo inclusivo usado pelos filtros rápidos do financeiro. */
export function financePeriodRange(
  period: FinancePeriod,
  month: number,
  year: number,
  today = new Date(),
): { startDate: string; endDate: string } {
  if (period === "today") {
    const date = isoDate(today);
    return { startDate: date, endDate: date };
  }
  if (period === "week") return currentWeekRange(today);
  if (period === "7days") {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    return { startDate: isoDate(start), endDate: isoDate(today) };
  }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

/** Soma entradas e saídas de uma lista já limitada ao período. */
export function totalsByType(entries: ReadonlyArray<{ type: string; amount: number }>): {
  income: number;
  expenses: number;
} {
  let income = 0;
  let expenses = 0;
  for (const entry of entries) {
    if (entry.type === "income") income += entry.amount;
    else if (entry.type === "expense") expenses += entry.amount;
  }
  return { income, expenses };
}

/** Percentual já recebido do valor total das encomendas, entre 0 e 100. */
export function orderReceiptProgress(received: number, toReceive: number): number {
  const safeReceived = Math.max(received, 0);
  const total = safeReceived + Math.max(toReceive, 0);
  if (total === 0) return 0;
  return Math.round((safeReceived / total) * 100);
}

/** Saldo líquido de um conjunto de lançamentos: entradas − saídas. */
export function entryBalance(
  entries: ReadonlyArray<{ type: string; amount: number }>,
): number {
  const totals = totalsByType(entries);
  return totals.income - totals.expenses;
}

/** Despesas muito acima do padrÃ£o observÃ¡vel do perÃ­odo (2x a mediana, com base >= 4). */
export function unusualExpenses<T extends { type: string; amount: number }>(
  entries: ReadonlyArray<T>,
): T[] {
  const expenses = entries
    .filter((entry) => entry.type === "expense")
    .sort((a, b) => a.amount - b.amount);
  if (expenses.length < 4) return [];
  const middle = Math.floor(expenses.length / 2);
  const median =
    expenses.length % 2 === 0
      ? (expenses[middle - 1].amount + expenses[middle].amount) / 2
      : expenses[middle].amount;
  if (median <= 0) return [];
  return expenses.filter((entry) => entry.amount >= median * 2);
}
