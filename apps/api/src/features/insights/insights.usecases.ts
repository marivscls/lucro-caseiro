import type { Insights, MonthlyRevenue } from "@lucro-caseiro/contracts";

import { clampMonths, monthKeys, startOfRange } from "./insights.domain";
import type { IInsightsRepo } from "./insights.types";

const TOP_LIMIT = 5;

export class InsightsUseCases {
  constructor(private repo: IInsightsRepo) {}

  async getInsights(userId: string, monthsInput?: number): Promise<Insights> {
    const months = clampMonths(monthsInput);
    const now = new Date();
    const since = startOfRange(now, months);

    const [topProducts, topClients, monthly] = await Promise.all([
      this.repo.topProducts(userId, since, TOP_LIMIT),
      this.repo.topClients(userId, since, TOP_LIMIT),
      this.repo.monthlyRevenue(userId, since),
    ]);

    // Preenche os meses sem vendas para um gráfico contínuo.
    const byKey = new Map(monthly.map((m) => [m.month, m]));
    const monthlyRevenue: MonthlyRevenue[] = monthKeys(now, months).map(
      (key) => byKey.get(key) ?? { month: key, revenue: 0, salesCount: 0 },
    );

    const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
    const totalSales = monthlyRevenue.reduce((sum, m) => sum + m.salesCount, 0);

    return { months, totalRevenue, totalSales, topProducts, topClients, monthlyRevenue };
  }
}
