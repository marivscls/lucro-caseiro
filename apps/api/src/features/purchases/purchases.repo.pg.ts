import type { Purchase } from "@lucro-caseiro/contracts";
import { purchases } from "@lucro-caseiro/database/schema";
import { and, count, desc, eq } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type {
  CreatePurchaseData,
  FindAllPurchasesOpts,
  IPurchasesRepo,
  UpdatePurchaseData,
} from "./purchases.types";

export class PurchasesRepoPg implements IPurchasesRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreatePurchaseData): Promise<Purchase> {
    const [row] = await this.db
      .insert(purchases)
      .values({
        userId,
        supplierId: data.supplierId ?? null,
        description: data.description,
        amount: String(data.amount),
        category: data.category ?? "material",
        paymentStatus: data.paymentStatus ?? "pending",
        purchasedAt: data.purchasedAt,
        dueDate: data.dueDate ?? null,
      })
      .returning();

    return this.toPurchase(row!);
  }

  async findById(userId: string, id: string): Promise<Purchase | null> {
    const [row] = await this.db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.id, id)));

    return row ? this.toPurchase(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllPurchasesOpts,
  ): Promise<{ items: Purchase[]; total: number }> {
    const conditions = [eq(purchases.userId, userId)];
    if (opts.status) {
      conditions.push(eq(purchases.paymentStatus, opts.status));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(purchases)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(desc(purchases.purchasedAt), desc(purchases.createdAt)),
      this.db.select({ value: count() }).from(purchases).where(where),
    ]);

    return {
      items: rows.map((r) => this.toPurchase(r)),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: UpdatePurchaseData,
  ): Promise<Purchase | null> {
    const set: Record<string, unknown> = {};
    if (data.paymentStatus !== undefined) set.paymentStatus = data.paymentStatus;
    if (data.paidAt !== undefined) set.paidAt = data.paidAt ?? null;
    if (data.financeEntryId !== undefined)
      set.financeEntryId = data.financeEntryId ?? null;

    if (Object.keys(set).length === 0) return this.findById(userId, id);

    const [row] = await this.db
      .update(purchases)
      .set(set)
      .where(and(eq(purchases.userId, userId), eq(purchases.id, id)))
      .returning();

    return row ? this.toPurchase(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.id, id)))
      .returning({ id: purchases.id });

    return !!row;
  }

  private toPurchase(row: typeof purchases.$inferSelect): Purchase {
    return {
      id: row.id,
      userId: row.userId,
      supplierId: row.supplierId,
      description: row.description,
      amount: Number(row.amount),
      category: row.category,
      paymentStatus: row.paymentStatus as "pending" | "paid",
      purchasedAt: row.purchasedAt,
      dueDate: row.dueDate,
      paidAt: row.paidAt,
      financeEntryId: row.financeEntryId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
