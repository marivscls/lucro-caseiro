import type { Purchase } from "@lucro-caseiro/contracts";
import { purchaseItems, purchases } from "@lucro-caseiro/database/schema";
import { and, count, desc, eq } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type {
  CreatePurchaseRecord,
  FindAllPurchasesOpts,
  IPurchasesRepo,
  UpdatePurchaseData,
} from "./purchases.types";

export class PurchasesRepoPg implements IPurchasesRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreatePurchaseRecord): Promise<Purchase> {
    const [row] = await this.db
      .insert(purchases)
      .values({
        userId,
        supplierId: data.supplierId ?? null,
        description: data.description,
        amount: String(
          data.items?.length
            ? data.items.reduce((total, item) => total + item.quantity * item.unitCost, 0)
            : data.amount,
        ),
        category: data.category ?? "material",
        paymentStatus: data.paymentStatus ?? "pending",
        purchasedAt: data.purchasedAt,
        dueDate: data.dueDate ?? null,
      })
      .returning();

    if (data.items?.length) {
      await this.db.insert(purchaseItems).values(
        data.items.map((item) => ({
          purchaseId: row!.id,
          productId: item.productId,
          productName: item.productName,
          variationId: item.variationId ?? null,
          variationName: item.variationName ?? null,
          quantity: String(item.quantity),
          unitCost: String(item.unitCost),
          subtotal: String(item.quantity * item.unitCost),
        })),
      );
    }

    return (await this.findById(userId, row!.id))!;
  }

  async findById(userId: string, id: string): Promise<Purchase | null> {
    const [row] = await this.db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.id, id)));

    return row ? this.toPurchase(row, await this.itemsFor(row.id)) : null;
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
      items: await Promise.all(
        rows.map(async (row) => this.toPurchase(row, await this.itemsFor(row.id))),
      ),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: UpdatePurchaseData,
  ): Promise<Purchase | null> {
    const set: Record<string, unknown> = {};
    if (data.supplierId !== undefined) set.supplierId = data.supplierId;
    if (data.description !== undefined) set.description = data.description;
    if (data.amount !== undefined) set.amount = String(data.amount);
    if (data.category !== undefined) set.category = data.category;
    if (data.purchasedAt !== undefined) set.purchasedAt = data.purchasedAt;
    if (data.dueDate !== undefined) set.dueDate = data.dueDate;
    if (data.paymentStatus !== undefined) set.paymentStatus = data.paymentStatus;
    if (data.paidAt !== undefined) set.paidAt = data.paidAt ?? null;
    if (data.financeEntryId !== undefined)
      set.financeEntryId = data.financeEntryId ?? null;

    let found = false;
    await this.db.transaction(async (tx) => {
      if (Object.keys(set).length > 0) {
        const [row] = await tx
          .update(purchases)
          .set(set)
          .where(and(eq(purchases.userId, userId), eq(purchases.id, id)))
          .returning({ id: purchases.id });
        found = !!row;
      } else {
        const [row] = await tx
          .select({ id: purchases.id })
          .from(purchases)
          .where(and(eq(purchases.userId, userId), eq(purchases.id, id)));
        found = !!row;
      }

      if (!found || data.items === undefined) return;

      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
      if (data.items.length > 0) {
        await tx.insert(purchaseItems).values(
          data.items.map((item) => ({
            purchaseId: id,
            productId: item.productId,
            productName: item.productName,
            variationId: item.variationId ?? null,
            variationName: item.variationName ?? null,
            quantity: String(item.quantity),
            unitCost: String(item.unitCost),
            subtotal: String(item.quantity * item.unitCost),
          })),
        );
      }
    });

    return found ? this.findById(userId, id) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.id, id)))
      .returning({ id: purchases.id });

    return !!row;
  }

  private itemsFor(purchaseId: string) {
    return this.db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchaseId));
  }

  private toPurchase(
    row: typeof purchases.$inferSelect,
    items: Array<typeof purchaseItems.$inferSelect>,
  ): Purchase {
    return {
      id: row.id,
      userId: row.userId,
      supplierId: row.supplierId,
      description: row.description,
      amount: Number(row.amount),
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        variationId: item.variationId,
        variationName: item.variationName,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        subtotal: Number(item.subtotal),
      })),
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
