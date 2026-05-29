import type { ProlaboreGoal } from "@lucro-caseiro/contracts";

export interface UpsertGoalData {
  monthlyProlaboreGoal: number;
  estimatedMonthlyCosts?: number;
  avgTicketOverride?: number;
}

export interface IGoalsRepo {
  findByUser(userId: string): Promise<ProlaboreGoal | null>;
  upsert(userId: string, data: UpsertGoalData): Promise<ProlaboreGoal>;
  deleteByUser(userId: string): Promise<boolean>;
}

// Providers injetados a partir de outras features (composition root).
// Mantem o boundary: goals nao importa arquivos internos de finance/sales/products.

export interface IMonthlyFinanceProvider {
  getMonthlySummary(
    userId: string,
    month: number,
    year: number,
  ): Promise<{ totalIncome: number; totalExpenses: number }>;
}

export interface IMonthlySalesCounter {
  countThisMonth(userId: string): Promise<number>;
}

export interface IAvgProductPriceProvider {
  averageActivePrice(userId: string): Promise<number | null>;
}
