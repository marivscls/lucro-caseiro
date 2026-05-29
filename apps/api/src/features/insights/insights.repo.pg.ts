import type { MonthlyRevenue, TopClient, TopProduct } from "@lucro-caseiro/contracts";
import { clients, products, saleItems, sales } from "@lucro-caseiro/database/schema";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { IInsightsRepo } from "./insights.types";

const NOT_CANCELLED = sql`${sales.status} != 'cancelled'`;

export class InsightsRepoPg implements IInsightsRepo {
  constructor(private db: AppDatabase) {}

  async topProducts(userId: string, since: Date, limit: number): Promise<TopProduct[]> {
    const qty = sql<string>`sum(${saleItems.quantity})`;
    const revenue = sql<string>`sum(${saleItems.subtotal})`;

    const rows = await this.db
      .select({
        productId: products.id,
        name: products.name,
        quantity: qty,
        revenue,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(and(eq(sales.userId, userId), NOT_CANCELLED, gte(sales.soldAt, since)))
      .groupBy(products.id, products.name)
      .orderBy(desc(qty))
      .limit(limit);

    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      quantity: Number(r.quantity ?? 0),
      revenue: Number(r.revenue ?? 0),
    }));
  }

  async topClients(userId: string, since: Date, limit: number): Promise<TopClient[]> {
    const totalSpent = sql<string>`sum(${sales.total})`;

    const rows = await this.db
      .select({
        clientId: clients.id,
        name: clients.name,
        totalSpent,
        salesCount: count(sales.id),
      })
      .from(sales)
      .innerJoin(clients, eq(sales.clientId, clients.id))
      .where(and(eq(sales.userId, userId), NOT_CANCELLED, gte(sales.soldAt, since)))
      .groupBy(clients.id, clients.name)
      .orderBy(desc(totalSpent))
      .limit(limit);

    return rows.map((r) => ({
      clientId: r.clientId,
      name: r.name,
      totalSpent: Number(r.totalSpent ?? 0),
      salesCount: Number(r.salesCount ?? 0),
    }));
  }

  async monthlyRevenue(userId: string, since: Date): Promise<MonthlyRevenue[]> {
    const month = sql<string>`to_char(${sales.soldAt}, 'YYYY-MM')`;
    const revenue = sql<string>`sum(${sales.total})`;

    const rows = await this.db
      .select({
        month,
        revenue,
        salesCount: count(sales.id),
      })
      .from(sales)
      .where(and(eq(sales.userId, userId), NOT_CANCELLED, gte(sales.soldAt, since)))
      .groupBy(month)
      .orderBy(month);

    return rows.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue ?? 0),
      salesCount: Number(r.salesCount ?? 0),
    }));
  }
}
