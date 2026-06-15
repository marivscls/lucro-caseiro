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
