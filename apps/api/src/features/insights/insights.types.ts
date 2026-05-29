import type { MonthlyRevenue, TopClient, TopProduct } from "@lucro-caseiro/contracts";

export interface IInsightsRepo {
  topProducts(userId: string, since: Date, limit: number): Promise<TopProduct[]>;
  topClients(userId: string, since: Date, limit: number): Promise<TopClient[]>;
  monthlyRevenue(userId: string, since: Date): Promise<MonthlyRevenue[]>;
}
