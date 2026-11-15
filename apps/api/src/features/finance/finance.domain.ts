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

// ---------------------------------------------------------------------------
// Gratuito (2026-11-15): a tela Financeiro mostra só a semana atual (segunda a
// domingo, horário de Brasília) e o resumo só do mês corrente. Ver
// docs/planos-comerciais.md (`financeHistory`).
// ---------------------------------------------------------------------------

export const FINANCE_TIME_ZONE = "America/Sao_Paulo";

export const FINANCE_HISTORY_PREMIUM_MESSAGE =
  "Ver meses anteriores do financeiro faz parte do plano Premium.";

export interface DateRange {
  startDate: string;
  endDate: string;
}

function brazilDateParts(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FINANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function isoDay(utcMillis: number): string {
  return new Date(utcMillis).toISOString().slice(0, 10);
}

/** Semana atual (segunda 00:00 a domingo 23:59:59, horário de Brasília) em YYYY-MM-DD. */
export function currentWeekRange(now: Date = new Date()): DateRange {
  const { year, month, day } = brazilDateParts(now);
  const today = Date.UTC(year, month - 1, day);
  const weekday = new Date(today).getUTCDay(); // 0 = domingo
  const daysSinceMonday = (weekday + 6) % 7;
  const dayMs = 24 * 60 * 60 * 1000;
  const monday = today - daysSinceMonday * dayMs;
  return { startDate: isoDay(monday), endDate: isoDay(monday + 6 * dayMs) };
}

/**
 * Prende o período pedido dentro da semana: início sobe até a segunda, fim desce
 * até o domingo. Período inteiro fora da semana vira um intervalo vazio (início > fim).
 */
export function clampToWeek(
  requested: { startDate?: string; endDate?: string },
  week: DateRange,
): DateRange {
  const startDate =
    requested.startDate && requested.startDate > week.startDate
      ? requested.startDate
      : week.startDate;
  const endDate =
    requested.endDate && requested.endDate < week.endDate
      ? requested.endDate
      : week.endDate;
  return { startDate, endDate };
}

/** Mês (1-12) e ano corrente no horário de Brasília. */
export function currentBrazilMonth(now: Date = new Date()): {
  month: number;
  year: number;
} {
  const { month, year } = brazilDateParts(now);
  return { month, year };
}

/** Mês/ano corrente no horário de Brasília. */
export function isCurrentBrazilMonth(
  month: number,
  year: number,
  now: Date = new Date(),
): boolean {
  const today = brazilDateParts(now);
  return today.month === month && today.year === year;
}
