import type { MeiActivity, MeiSummary } from "@lucro-caseiro/contracts";

import { ValidationError } from "../../shared/errors";
import { buildMeiSummary, currentYearMonth } from "./mei.domain";
import type { IMeiRepo, IMonthlyIncomeProvider } from "./mei.types";

export class MeiUseCases {
  constructor(
    private repo: IMeiRepo,
    private income: IMonthlyIncomeProvider,
    private clock: () => Date = () => new Date(),
  ) {}

  async updateActivity(userId: string, activity: MeiActivity | null) {
    return { activity: await this.repo.setActivity(userId, activity) };
  }

  /**
   * Resumo do ano e relatório do mês. Sem mês/ano, usa o mês atual. Para um
   * ano que já acabou, soma os 12 meses; para o ano atual, até o mês de hoje.
   */
  async getSummary(userId: string, year?: number, month?: number): Promise<MeiSummary> {
    const today = currentYearMonth(this.clock());
    const targetYear = year ?? today.year;
    const targetMonth = month ?? (targetYear === today.year ? today.month : 12);
    if (
      targetYear > today.year ||
      (targetYear === today.year && targetMonth > today.month)
    ) {
      throw new ValidationError(["Escolha um mês que já começou."]);
    }
    const lastMonth = targetYear === today.year ? today.month : 12;
    const [activity, monthlyIncome] = await Promise.all([
      this.repo.getActivity(userId),
      Promise.all(
        Array.from({ length: lastMonth }, (_, index) =>
          this.income
            .getMonthlySummary(userId, index + 1, targetYear)
            .then((summary) => summary.totalIncome),
        ),
      ),
    ]);
    return buildMeiSummary({
      year: targetYear,
      month: targetMonth,
      activity,
      monthlyIncome,
    });
  }
}
