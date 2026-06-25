import type { FinanceEntry } from "@lucro-caseiro/contracts";

import type { CreateFinanceEntryData } from "./finance.types";

export function calculateProfit(income: number, expenses: number): number {
  return income - expenses;
}

export function validateFinanceEntry(data: CreateFinanceEntryData): string[] {
  const errors: string[] = [];

  if (data.amount <= 0) {
    errors.push("Valor deve ser maior que zero");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Descrição é obrigatória");
  }

  if (data.description && data.description.length > 500) {
    errors.push("Descrição deve ter no máximo 500 caracteres");
  }

  if (!data.date || !isValidDate(data.date)) {
    errors.push("Data invalida");
  }

  return errors;
}

export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function groupByCategory(entries: FinanceEntry[]): Record<string, FinanceEntry[]> {
  const groups: Record<string, FinanceEntry[]> = {};

  for (const entry of entries) {
    const cat = entry.category;
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(entry);
  }

  return groups;
}

export function validateRecurringExpense(data: {
  amount: number;
  description: string;
  dayOfMonth: number;
}): string[] {
  const errors: string[] = [];
  if (data.amount <= 0) errors.push("Valor deve ser maior que zero");
  if (!data.description || data.description.trim().length === 0) {
    errors.push("Descrição é obrigatória");
  }
  if (data.description && data.description.length > 500) {
    errors.push("Descrição deve ter no máximo 500 caracteres");
  }
  if (!Number.isInteger(data.dayOfMonth) || data.dayOfMonth < 1 || data.dayOfMonth > 28) {
    errors.push("Dia do mês deve estar entre 1 e 28");
  }
  return errors;
}

/**
 * Data (YYYY-MM-DD) do lançamento de um gasto recorrente no mês. O dia é limitado
 * ao tamanho do mês (defensivo; `dayOfMonth` já é 1–28).
 */
export function recurringEntryDate(
  year: number,
  month: number,
  dayOfMonth: number,
): string {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(Math.max(dayOfMonth, 1), lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const parsed = new Date(dateStr + "T00:00:00Z");
  return !isNaN(parsed.getTime());
}
