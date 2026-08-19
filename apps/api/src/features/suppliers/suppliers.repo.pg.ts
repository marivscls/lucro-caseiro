import type {
  Supplier,
  SupplierOverviewItem,
  SupplierPurchaseSnapshot,
  SuppliersOverview,
} from "@lucro-caseiro/contracts";
import { purchaseItems, purchases, suppliers } from "@lucro-caseiro/database/schema";
import { and, count, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreateSupplierData, FindAllOpts, ISuppliersRepo } from "./suppliers.types";
import { monthlySupplierPurchaseSummary } from "./suppliers.domain";

export class SuppliersRepoPg implements ISuppliersRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateSupplierData): Promise<Supplier> {
    const [row] = await this.db
      .insert(suppliers)
      .values({
        userId,
        name: data.name,
        category: data.category ?? "other",
        phone: data.phone ?? null,
        hasWhatsApp: data.hasWhatsApp ?? false,
        email: data.email ?? null,
        address: data.address ?? null,
        purchaseDescription: data.purchaseDescription ?? null,
        notes: data.notes ?? null,
        isPreferred: data.isPreferred ?? false,
        avatarType: data.avatarType ?? "initials",
        avatarPresetId: data.avatarPresetId ?? null,
        avatarUrl: data.avatarUrl ?? null,
        needsFollowUp: data.needsFollowUp ?? false,
        restockSoon: data.restockSoon ?? false,
        isActive: data.isActive ?? true,
      })
      .returning();

    return this.toSupplier(row!);
  }

  async findById(userId: string, id: string): Promise<Supplier | null> {
    const [row] = await this.db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.userId, userId), eq(suppliers.id, id)));

    return row ? this.toSupplier(row) : null;
  }

  async findDuplicate(
    userId: string,
    data: Pick<CreateSupplierData, "name" | "phone" | "email">,
    excludeId?: string,
  ): Promise<Supplier | null> {
    const matchers = [sql`lower(trim(${suppliers.name})) = lower(trim(${data.name}))`];
    const phoneDigits = data.phone?.replace(/\D/g, "") ?? "";
    if (phoneDigits) {
      matchers.push(
        sql`regexp_replace(coalesce(${suppliers.phone}, ''), '\\D', '', 'g') = ${phoneDigits}`,
      );
    }
    if (data.email?.trim()) {
      matchers.push(
        sql`lower(trim(coalesce(${suppliers.email}, ''))) = lower(trim(${data.email}))`,
      );
    }

    const conditions = [
      eq(suppliers.userId, userId),
      eq(suppliers.isActive, true),
      or(...matchers)!,
    ];
    if (excludeId) conditions.push(sql`${suppliers.id} <> ${excludeId}`);

    const [row] = await this.db
      .select()
      .from(suppliers)
      .where(and(...conditions))
      .limit(1);

    return row ? this.toSupplier(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Supplier[]; total: number }> {
    const conditions = [eq(suppliers.userId, userId), eq(suppliers.isActive, true)];

    if (opts.search) {
      conditions.push(
        or(
          ilike(suppliers.name, `%${opts.search}%`),
          ilike(suppliers.phone, `%${opts.search}%`),
          ilike(suppliers.purchaseDescription, `%${opts.search}%`),
        )!,
      );
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(suppliers)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${suppliers.createdAt} DESC`),
      this.db.select({ value: count() }).from(suppliers).where(where),
    ]);

    return {
      items: rows.map((r) => this.toSupplier(r)),
      total: countResult?.value ?? 0,
    };
  }

  async getOverview(userId: string, now: Date): Promise<SuppliersOverview> {
    const activeSuppliers = await this.db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.userId, userId), eq(suppliers.isActive, true)));

    const supplierIds = activeSuppliers.map((supplier) => supplier.id);
    const purchaseRows = await this.db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), isNotNull(purchases.supplierId)));

    const bySupplier = new Map<
      string,
      {
        purchases: typeof purchaseRows;
        last: (typeof purchaseRows)[number] | null;
      }
    >();
    for (const supplierId of supplierIds) {
      bySupplier.set(supplierId, { purchases: [], last: null });
    }
    for (const purchase of purchaseRows) {
      if (!purchase.supplierId) continue;
      const group = bySupplier.get(purchase.supplierId);
      if (!group) continue;
      group.purchases.push(purchase);
      if (
        !group.last ||
        purchase.purchasedAt > group.last.purchasedAt ||
        (purchase.purchasedAt === group.last.purchasedAt &&
          purchase.createdAt > group.last.createdAt)
      ) {
        group.last = purchase;
      }
    }

    const lastPurchaseIds = [...bySupplier.values()]
      .map((group) => group.last?.id)
      .filter((id): id is string => !!id);
    const itemRows = lastPurchaseIds.length
      ? await this.db
          .select()
          .from(purchaseItems)
          .where(inArray(purchaseItems.purchaseId, lastPurchaseIds))
      : [];
    const itemsByPurchase = new Map<string, SupplierPurchaseSnapshot["items"]>();
    for (const item of itemRows) {
      const items = itemsByPurchase.get(item.purchaseId) ?? [];
      items.push({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        variationId: item.variationId,
        variationName: item.variationName,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        subtotal: Number(item.subtotal),
      });
      itemsByPurchase.set(item.purchaseId, items);
    }

    const month = monthlySupplierPurchaseSummary(purchaseRows, now);

    const items: SupplierOverviewItem[] = activeSuppliers.map((row) => {
      const group = bySupplier.get(row.id)!;
      const last = group.last;
      return {
        ...this.toSupplier(row),
        lastPurchase: last
          ? {
              id: last.id,
              description: last.description,
              amount: Number(last.amount),
              category: last.category,
              purchasedAt: last.purchasedAt,
              items: itemsByPurchase.get(last.id) ?? [],
            }
          : null,
        totalPurchaseCount: group.purchases.length,
        totalPurchaseAmount:
          group.purchases.reduce(
            (totalInCents, purchase) =>
              totalInCents + Math.round(Number(purchase.amount) * 100),
            0,
          ) / 100,
        hasOpenOrder: group.purchases.some(
          (purchase) => purchase.paymentStatus === "pending",
        ),
      };
    });

    return {
      month: {
        ...month,
        planningStatus: "none",
      },
      items,
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateSupplierData>,
  ): Promise<Supplier | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.hasWhatsApp !== undefined) updateData.hasWhatsApp = data.hasWhatsApp;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.purchaseDescription !== undefined)
      updateData.purchaseDescription = data.purchaseDescription;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isPreferred !== undefined) updateData.isPreferred = data.isPreferred;
    if (data.avatarType !== undefined) updateData.avatarType = data.avatarType;
    if (data.avatarPresetId !== undefined)
      updateData.avatarPresetId = data.avatarPresetId;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.needsFollowUp !== undefined) updateData.needsFollowUp = data.needsFollowUp;
    if (data.restockSoon !== undefined) updateData.restockSoon = data.restockSoon;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId, id);
    }

    const [row] = await this.db
      .update(suppliers)
      .set(updateData)
      .where(and(eq(suppliers.userId, userId), eq(suppliers.id, id)))
      .returning();

    return row ? this.toSupplier(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(suppliers)
      .where(and(eq(suppliers.userId, userId), eq(suppliers.id, id)))
      .returning({ id: suppliers.id });

    return !!row;
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(suppliers)
      .where(and(eq(suppliers.userId, userId), eq(suppliers.isActive, true)));

    return result?.value ?? 0;
  }

  private toSupplier(row: typeof suppliers.$inferSelect): Supplier {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      category: row.category as Supplier["category"],
      phone: row.phone,
      hasWhatsApp: row.hasWhatsApp,
      email: row.email,
      address: row.address,
      purchaseDescription: row.purchaseDescription,
      notes: row.notes,
      isPreferred: row.isPreferred,
      avatarType: row.avatarType as Supplier["avatarType"],
      avatarPresetId: row.avatarPresetId,
      avatarUrl: row.avatarUrl,
      needsFollowUp: row.needsFollowUp,
      restockSoon: row.restockSoon,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
