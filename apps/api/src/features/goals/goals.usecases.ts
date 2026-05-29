import type { ProlaboreGoal, ProlaboreStatus } from "@lucro-caseiro/contracts";

import { ValidationError } from "../../shared/errors";
import { calculateProlaboreProgress, emptyProgress, validateGoal } from "./goals.domain";
import type {
  IAvgProductPriceProvider,
  IGoalsRepo,
  IMonthlyFinanceProvider,
  IMonthlySalesCounter,
  UpsertGoalData,
} from "./goals.types";

export class GoalsUseCases {
  constructor(
    private repo: IGoalsRepo,
    private finance: IMonthlyFinanceProvider,
    private sales: IMonthlySalesCounter,
    private products: IAvgProductPriceProvider,
  ) {}

  async upsert(userId: string, data: UpsertGoalData): Promise<ProlaboreGoal> {
    const errors = validateGoal(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    return this.repo.upsert(userId, data);
  }

  async remove(userId: string): Promise<void> {
    await this.repo.deleteByUser(userId);
  }

  /** Configuracao + progresso da meta de pro-labore no mes corrente. */
  async getProlaboreStatus(userId: string): Promise<ProlaboreStatus> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const period = `${year}-${String(month).padStart(2, "0")}`;

    const config = await this.repo.findByUser(userId);
    if (!config) {
      return { config: null, progress: emptyProgress(period) };
    }

    const [summary, salesCount, avgPrice] = await Promise.all([
      this.finance.getMonthlySummary(userId, month, year),
      this.sales.countThisMonth(userId),
      this.products.averageActivePrice(userId),
    ]);

    const avgTicket =
      config.avgTicketOverride ??
      (salesCount > 0 ? summary.totalIncome / salesCount : avgPrice);

    const progress = calculateProlaboreProgress(
      {
        monthlyProlaboreGoal: config.monthlyProlaboreGoal,
        estimatedMonthlyCosts: config.estimatedMonthlyCosts,
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        avgTicket,
      },
      period,
    );

    return { config, progress };
  }
}
