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
    errors.push("Descricao e obrigatoria");
  }

  if (data.description && data.description.length > 500) {
    errors.push("Descricao deve ter no maximo 500 caracteres");
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

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const parsed = new Date(dateStr + "T00:00:00Z");
  return !isNaN(parsed.getTime());
}
