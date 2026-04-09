import type { Pricing } from "@lucro-caseiro/contracts";
import { pricingCalculations } from "@lucro-caseiro/database/schema";
import { and, count, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreatePricingData, FindAllOpts, IPricingRepo } from "./pricing.types";

export class PricingRepoPg implements IPricingRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreatePricingData): Promise<Pricing> {
    const [row] = await this.db
      .insert(pricingCalculations)
      .values({
        userId,
        productId: data.productId ?? null,
        ingredientCost: String(data.ingredientCost),
        packagingCost: String(data.packagingCost),
        laborCost: String(data.laborCost),
        fixedCostShare: String(data.fixedCostShare),
        totalCost: String(data.totalCost),
        marginPercent: String(data.marginPercent),
        suggestedPrice: String(data.suggestedPrice),
      })
      .returning();

    return this.toPricing(row!);
  }

  async findById(userId: string, id: string): Promise<Pricing | null> {
    const [row] = await this.db
      .select()
      .from(pricingCalculations)
      .where(and(eq(pricingCalculations.userId, userId), eq(pricingCalculations.id, id)));

    return row ? this.toPricing(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Pricing[]; total: number }> {
    const conditions = [eq(pricingCalculations.userId, userId)];

    if (opts.productId) {
      conditions.push(eq(pricingCalculations.productId, opts.productId));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(pricingCalculations)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${pricingCalculations.createdAt} DESC`),
      this.db.select({ value: count() }).from(pricingCalculations).where(where),
    ]);

    return {
      items: rows.map((r) => this.toPricing(r)),
      total: countResult?.value ?? 0,
    };
  }

  async findByProduct(userId: string, productId: string): Promise<Pricing[]> {
    const rows = await this.db
      .select()
      .from(pricingCalculations)
      .where(
        and(
          eq(pricingCalculations.userId, userId),
          eq(pricingCalculations.productId, productId),
        ),
      )
      .orderBy(sql`${pricingCalculations.createdAt} DESC`);

    return rows.map((r) => this.toPricing(r));
  }

  private toPricing(row: typeof pricingCalculations.$inferSelect): Pricing {
    return {
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      ingredientCost: Number(row.ingredientCost),
      packagingCost: Number(row.packagingCost),
      laborCost: Number(row.laborCost),
      fixedCostShare: Number(row.fixedCostShare),
      totalCost: Number(row.totalCost),
      marginPercent: Number(row.marginPercent),
      suggestedPrice: Number(row.suggestedPrice),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
