import type {
  Pricing,
  PricingPreferences,
  UpsertPricingPreferences,
} from "@lucro-caseiro/contracts";
import { pricingCalculations, pricingPreferences } from "@lucro-caseiro/database/schema";
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
        feesPercent: String(data.feesPercent),
        feesAmount: String(data.feesAmount),
        finalPrice: String(data.finalPrice),
        allocationMode: data.allocationMode,
        monthlyFixedCosts:
          data.monthlyFixedCosts != null ? String(data.monthlyFixedCosts) : null,
        revenueBasis: data.revenueBasis != null ? String(data.revenueBasis) : null,
        overheadPercent: String(data.overheadPercent),
        channelName: data.channelName ?? null,
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

  async getPreferences(userId: string): Promise<PricingPreferences | null> {
    const [row] = await this.db
      .select()
      .from(pricingPreferences)
      .where(eq(pricingPreferences.userId, userId));
    return row ? this.toPreferences(row) : null;
  }

  async upsertPreferences(
    userId: string,
    data: UpsertPricingPreferences,
  ): Promise<PricingPreferences> {
    const [row] = await this.db
      .insert(pricingPreferences)
      .values({ userId, channelFees: data.channelFees, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: pricingPreferences.userId,
        set: { channelFees: data.channelFees, updatedAt: new Date() },
      })
      .returning();
    return this.toPreferences(row!);
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
      feesPercent: Number(row.feesPercent),
      feesAmount: Number(row.feesAmount),
      finalPrice: Number(row.finalPrice),
      allocationMode: row.allocationMode as Pricing["allocationMode"],
      monthlyFixedCosts:
        row.monthlyFixedCosts != null ? Number(row.monthlyFixedCosts) : null,
      revenueBasis: row.revenueBasis != null ? Number(row.revenueBasis) : null,
      overheadPercent: Number(row.overheadPercent),
      channelName: row.channelName,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toPreferences(row: typeof pricingPreferences.$inferSelect): PricingPreferences {
    return {
      userId: row.userId,
      channelFees: row.channelFees,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
