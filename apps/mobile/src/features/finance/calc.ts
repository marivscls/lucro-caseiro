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

export type FinancePeriod = "today" | "7days" | "month";

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
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
