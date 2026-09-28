import type { MeiActivity } from "@lucro-caseiro/contracts";

export interface IMeiRepo {
  getActivity(userId: string): Promise<MeiActivity | null>;
  setActivity(userId: string, activity: MeiActivity | null): Promise<MeiActivity | null>;
}

/** Entradas do mês, vindas do Financeiro (injetado no composition root). */
export interface IMonthlyIncomeProvider {
  getMonthlySummary(
    userId: string,
    month: number,
    year: number,
  ): Promise<{ totalIncome: number }>;
}
