import type { ProlaboreProgress } from "@lucro-caseiro/contracts";

import type { UpsertGoalData } from "./goals.types";

export interface ProlaboreInputs {
  monthlyProlaboreGoal: number;
  estimatedMonthlyCosts: number | null;
  totalIncome: number;
  totalExpenses: number;
  avgTicket: number | null;
}

export function validateGoal(data: UpsertGoalData): string[] {
  const errors: string[] = [];

  if (data.monthlyProlaboreGoal <= 0) {
    errors.push("A meta deve ser maior que zero");
  }
  if (data.estimatedMonthlyCosts !== undefined && data.estimatedMonthlyCosts < 0) {
    errors.push("Os custos estimados não podem ser negativos");
  }
  if (data.avgTicketOverride !== undefined && data.avgTicketOverride <= 0) {
    errors.push("O ticket médio deve ser maior que zero");
  }

  return errors;
}

/**
 * Calcula o progresso da meta de pro-labore do mês corrente.
 *
 * requiredRevenue = meta + custos efetivos, onde custos efetivos =
 * max(despesas reais do mês, custos fixos estimados). Isso evita subestimar a
 * meta no início do mês, quando poucas despesas já foram lancadas.
 */
export function calculateProlaboreProgress(
  input: ProlaboreInputs,
  period: string,
): ProlaboreProgress {
  const effectiveCosts = Math.max(input.totalExpenses, input.estimatedMonthlyCosts ?? 0);
  const requiredRevenue = input.monthlyProlaboreGoal + effectiveCosts;
  const currentRevenue = input.totalIncome;
  const remainingRevenue = Math.max(0, requiredRevenue - currentRevenue);

  const progressPct =
    requiredRevenue > 0
      ? Math.min(100, Math.round((currentRevenue / requiredRevenue) * 100))
      : 0;

  const hasTicket = input.avgTicket !== null && input.avgTicket > 0;
  const salesNeeded = hasTicket
    ? Math.ceil(requiredRevenue / (input.avgTicket as number))
    : null;
  const salesRemaining = hasTicket
    ? Math.ceil(remainingRevenue / (input.avgTicket as number))
    : null;

  return {
    requiredRevenue,
    currentRevenue,
    remainingRevenue,
    progressPct,
    salesNeeded,
    salesRemaining,
    avgTicket: input.avgTicket,
    reached: currentRevenue >= requiredRevenue && requiredRevenue > 0,
    period,
  };
}

export function emptyProgress(period: string): ProlaboreProgress {
  return {
    requiredRevenue: 0,
    currentRevenue: 0,
    remainingRevenue: 0,
    progressPct: 0,
    salesNeeded: null,
    salesRemaining: null,
    avgTicket: null,
    reached: false,
    period,
  };
}
