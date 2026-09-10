import type {
  BusinessAccount,
  CashMovement,
  CreateRetailPromotion,
  RetailDocument,
  RetailDocumentKind,
  RetailPromotion,
  UpdateRetailDocument,
} from "@lucro-caseiro/contracts";
import {
  products,
  retailBusinessAccounts,
  retailCashMovements,
  retailDocumentItems,
  retailDocuments,
  retailPriceChanges,
  retailPromotions,
} from "@lucro-caseiro/database/schema";
import { and, asc, eq, gt, inArray, ne, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import { ValidationError } from "../../shared/errors";
import type {
  CreateBusinessAccountData,
  CreateCashMovementData,
  IRetailRepo,
  RetailDocumentCreateData,
  UpdateBusinessAccountData,
} from "./retail.types";

type DocumentRow = typeof retailDocuments.$inferSelect;
type DocumentItemRow = typeof retailDocumentItems.$inferSelect;
type RetailTransaction = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

export class RetailRepoPg implements IRetailRepo {
  constructor(private db: AppDatabase) {}

  async createDocument(
    userId: string,
    data: RetailDocumentCreateData,
    status: RetailDocument["status"],
    requirePublicProducts = false,
  ): Promise<RetailDocument> {
    return this.db.transaction(async (tx) => {
      if (data.kind === "catalog_order") {
        await this.assertReservationStock(tx, userId, data, requirePublicProducts);
      }
      const amount =
        data.amount ??
        data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const [document] = await tx
        .insert(retailDocuments)
        .values({
          userId,
          kind: data.kind,
          status,
          title: data.title,
          partyId: data.partyId ?? null,
          amount: String(amount),
          deposit: String(data.deposit ?? 0),
          dueAt: data.dueAt ? new Date(data.dueAt) : null,
          reservedUntil: data.reservedUntil ? new Date(data.reservedUntil) : null,
          payload: data.payload,
        })
        .returning();
      if (data.items.length) {
        await tx.insert(retailDocumentItems).values(
          data.items.map((item) => ({
            documentId: document!.id,
            productId: item.productId ?? null,
            variationId: item.variationId ?? null,
            name: item.name,
            variationName: item.variationName ?? null,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            subtotal: String(item.quantity * item.unitPrice),
            metadata: item.metadata ?? {},
          })),
        );
      }
      return this.findDocumentWith(document!, tx);
    });
  }

  async findDocument(userId: string, id: string): Promise<RetailDocument | null> {
    const [row] = await this.db
      .select()
      .from(retailDocuments)
      .where(and(eq(retailDocuments.userId, userId), eq(retailDocuments.id, id)));
    return row ? this.findDocumentWith(row, this.db) : null;
  }

  async findOpenCashSession(userId: string): Promise<RetailDocument | null> {
    const [row] = await this.db
      .select()
      .from(retailDocuments)
      .where(
        and(
          eq(retailDocuments.userId, userId),
          eq(retailDocuments.kind, "cash_session"),
          eq(retailDocuments.status, "open"),
        ),
      )
      .limit(1);
    return row ? this.findDocumentWith(row, this.db) : null;
  }

  async listDocuments(
    userId: string,
    kind: RetailDocumentKind,
  ): Promise<RetailDocument[]> {
    const rows = await this.db
      .select()
      .from(retailDocuments)
      .where(and(eq(retailDocuments.userId, userId), eq(retailDocuments.kind, kind)))
      .orderBy(sql`${retailDocuments.createdAt} DESC`);
    return Promise.all(rows.map((row) => this.findDocumentWith(row, this.db)));
  }

  async updateDocument(
    userId: string,
    id: string,
    data: UpdateRetailDocument,
  ): Promise<RetailDocument | null> {
    return this.db.transaction(async (tx) => {
      const fields: Record<string, unknown> = { updatedAt: new Date() };
      if (data.title !== undefined) fields.title = data.title;
      if (data.status !== undefined) fields.status = data.status;
      if (data.amount !== undefined) fields.amount = String(data.amount);
      if (data.deposit !== undefined) fields.deposit = String(data.deposit);
      if (data.dueAt !== undefined)
        fields.dueAt = data.dueAt ? new Date(data.dueAt) : null;
      if (data.reservedUntil !== undefined) {
        fields.reservedUntil = data.reservedUntil ? new Date(data.reservedUntil) : null;
      }
      if (data.payload !== undefined) fields.payload = data.payload;
      const [row] = await tx
        .update(retailDocuments)
        .set(fields)
        .where(and(eq(retailDocuments.userId, userId), eq(retailDocuments.id, id)))
        .returning();
      if (!row) return null;
      if (data.items) {
        await tx
          .delete(retailDocumentItems)
          .where(eq(retailDocumentItems.documentId, id));
        if (data.items.length) {
          await tx.insert(retailDocumentItems).values(
            data.items.map((item) => ({
              documentId: id,
              productId: item.productId ?? null,
              variationId: item.variationId ?? null,
              name: item.name,
              variationName: item.variationName ?? null,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPrice),
              subtotal: String(item.quantity * item.unitPrice),
              metadata: item.metadata ?? {},
            })),
          );
        }
      }
      return this.findDocumentWith(row, tx);
    });
  }

  async deleteDocument(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(retailDocuments)
      .where(and(eq(retailDocuments.userId, userId), eq(retailDocuments.id, id)))
      .returning({ id: retailDocuments.id });
    return !!row;
  }

  async createCashMovement(
    sessionId: string,
    data: CreateCashMovementData,
  ): Promise<CashMovement> {
    const [row] = await this.db
      .insert(retailCashMovements)
      .values({
        sessionId,
        type: data.type,
        paymentMethod: data.paymentMethod,
        amount: String(data.amount),
        referenceId: data.referenceId ?? null,
        note: data.note ?? null,
      })
      .returning();
    return this.toCashMovement(row!);
  }

  async listCashMovements(sessionId: string): Promise<CashMovement[]> {
    const rows = await this.db
      .select()
      .from(retailCashMovements)
      .where(eq(retailCashMovements.sessionId, sessionId))
      .orderBy(retailCashMovements.createdAt);
    return rows.map((row) => this.toCashMovement(row));
  }

  async createPromotion(
    userId: string,
    data: CreateRetailPromotion,
  ): Promise<RetailPromotion> {
    const [row] = await this.db
      .insert(retailPromotions)
      .values({
        userId,
        name: data.name,
        type: data.type,
        value: String(data.value),
        buyQuantity: data.buyQuantity ?? null,
        payQuantity: data.payQuantity ?? null,
        productId: data.productId ?? null,
        category: data.category ?? null,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        active: data.active,
      })
      .returning();
    return this.toPromotion(row!);
  }

  async listPromotions(userId: string, activeAt?: Date): Promise<RetailPromotion[]> {
    const conditions = [eq(retailPromotions.userId, userId)];
    if (activeAt) {
      conditions.push(eq(retailPromotions.active, true));
      conditions.push(sql`${retailPromotions.startsAt} <= ${activeAt}`);
      conditions.push(sql`${retailPromotions.endsAt} >= ${activeAt}`);
    }
    const rows = await this.db
      .select()
      .from(retailPromotions)
      .where(and(...conditions));
    return rows.map((row) => this.toPromotion(row));
  }

  async updatePromotion(
    userId: string,
    id: string,
    data: Partial<CreateRetailPromotion>,
  ): Promise<RetailPromotion | null> {
    const fields: Record<string, unknown> = {};
    for (const key of [
      "name",
      "type",
      "buyQuantity",
      "payQuantity",
      "productId",
      "category",
      "active",
    ] as const) {
      if (data[key] !== undefined) fields[key] = data[key];
    }
    if (data.value !== undefined) fields.value = String(data.value);
    if (data.startsAt !== undefined) fields.startsAt = new Date(data.startsAt);
    if (data.endsAt !== undefined) fields.endsAt = new Date(data.endsAt);
    const [row] = await this.db
      .update(retailPromotions)
      .set(fields)
      .where(and(eq(retailPromotions.userId, userId), eq(retailPromotions.id, id)))
      .returning();
    return row ? this.toPromotion(row) : null;
  }

  async deletePromotion(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(retailPromotions)
      .where(and(eq(retailPromotions.userId, userId), eq(retailPromotions.id, id)))
      .returning({ id: retailPromotions.id });
    return !!row;
  }

  async createBusinessAccount(
    userId: string,
    data: CreateBusinessAccountData,
  ): Promise<BusinessAccount> {
    const [row] = await this.db
      .insert(retailBusinessAccounts)
      .values({
        userId,
        clientId: data.clientId,
        kind: data.kind,
        legalName: data.legalName,
        document: data.document ?? null,
        contactName: data.contactName ?? null,
        creditLimit: String(data.creditLimit),
        dueDays: data.dueDays,
        discountPercent: String(data.discountPercent),
        active: data.active,
      })
      .returning();
    return this.toBusinessAccount(row!);
  }

  async listBusinessAccounts(userId: string): Promise<BusinessAccount[]> {
    const rows = await this.db
      .select()
      .from(retailBusinessAccounts)
      .where(eq(retailBusinessAccounts.userId, userId));
    return rows.map((row) => this.toBusinessAccount(row));
  }

  async updateBusinessAccount(
    userId: string,
    id: string,
    data: UpdateBusinessAccountData,
  ): Promise<BusinessAccount | null> {
    const fields: Record<string, unknown> = {};
    for (const key of [
      "clientId",
      "kind",
      "legalName",
      "document",
      "contactName",
      "dueDays",
      "active",
    ] as const) {
      if (data[key] !== undefined) fields[key] = data[key];
    }
    if (data.creditLimit !== undefined) fields.creditLimit = String(data.creditLimit);
    if (data.discountPercent !== undefined)
      fields.discountPercent = String(data.discountPercent);
    const [row] = await this.db
      .update(retailBusinessAccounts)
      .set(fields)
      .where(
        and(eq(retailBusinessAccounts.userId, userId), eq(retailBusinessAccounts.id, id)),
      )
      .returning();
    return row ? this.toBusinessAccount(row) : null;
  }

  async incrementUsedCredit(userId: string, id: string, delta: number): Promise<boolean> {
    const [row] = await this.db
      .update(retailBusinessAccounts)
      .set({ usedCredit: sql`${retailBusinessAccounts.usedCredit} + ${delta}` })
      .where(
        and(
          eq(retailBusinessAccounts.userId, userId),
          eq(retailBusinessAccounts.id, id),
          sql`${retailBusinessAccounts.usedCredit} + ${delta} >= 0`,
          sql`${retailBusinessAccounts.usedCredit} + ${delta} <= ${retailBusinessAccounts.creditLimit}`,
        ),
      )
      .returning({ id: retailBusinessAccounts.id });
    return !!row;
  }

  async reservedQuantities(
    userId: string,
    excludeDocumentId?: string,
    connection: AppDatabase | RetailTransaction = this.db,
  ): Promise<Map<string, { productId: string; variationId?: string; quantity: number }>> {
    const conditions = [
      eq(retailDocuments.userId, userId),
      eq(retailDocuments.kind, "catalog_order"),
      inArray(retailDocuments.status, ["new", "confirmed", "separated", "ready"]),
      gt(retailDocuments.reservedUntil, new Date()),
    ];
    if (excludeDocumentId) conditions.push(ne(retailDocuments.id, excludeDocumentId));
    const rows = await connection
      .select({
        productId: retailDocumentItems.productId,
        variationId: retailDocumentItems.variationId,
        quantity: sql<string>`sum(${retailDocumentItems.quantity})`,
      })
      .from(retailDocumentItems)
      .innerJoin(retailDocuments, eq(retailDocumentItems.documentId, retailDocuments.id))
      .where(and(...conditions))
      .groupBy(retailDocumentItems.productId, retailDocumentItems.variationId);
    const result = new Map<
      string,
      { productId: string; variationId?: string; quantity: number }
    >();
    for (const row of rows) {
      if (!row.productId) continue;
      const key = `${row.productId}:${row.variationId ?? "product"}`;
      result.set(key, {
        productId: row.productId,
        ...(row.variationId ? { variationId: row.variationId } : {}),
        quantity: Number(row.quantity),
      });
    }
    return result;
  }

  private async assertReservationStock(
    tx: RetailTransaction,
    userId: string,
    data: RetailDocumentCreateData,
    requirePublicProducts: boolean,
  ): Promise<void> {
    const ids = [...new Set(data.items.map((item) => item.productId))];
    if (ids.some((id) => !id)) throw new ValidationError(["Produto indisponível"]);
    if (!ids.length) return;
    // Lock in the same order for multi-product carts; re-read reservations after
    // acquiring the locks so a competing commit is visible under READ COMMITTED.
    const rows = await tx
      .select({
        id: products.id,
        isActive: products.isActive,
        publicEnabled: products.publicEnabled,
        stockQuantity: products.stockQuantity,
        variations: products.variations,
      })
      .from(products)
      .where(and(eq(products.userId, userId), inArray(products.id, ids as string[])))
      .orderBy(asc(products.id))
      .for("update");
    const byId = new Map(rows.map((product) => [product.id, product]));
    const reserved = await this.reservedQuantities(userId, undefined, tx);
    const requested = new Map<string, number>();
    for (const item of data.items) {
      const product = byId.get(item.productId!);
      if (
        !product ||
        !product.isActive ||
        (requirePublicProducts && !product.publicEnabled)
      ) {
        throw new ValidationError(["Produto indisponível"]);
      }
      const variation = product.variations?.find(
        (entry) => entry.id === item.variationId,
      );
      if ((item.variationId || product.variations?.length) && !variation) {
        throw new ValidationError(["Variação indisponível"]);
      }
      const key = `${product.id}:${variation?.id ?? "product"}`;
      const quantity = (requested.get(key) ?? 0) + item.quantity;
      requested.set(key, quantity);
      const physical = variation?.stockQuantity ?? product.stockQuantity;
      if (
        physical !== null &&
        Number(physical) - (reserved.get(key)?.quantity ?? 0) < quantity
      ) {
        throw new ValidationError(["Estoque disponível insuficiente"]);
      }
    }
  }

  async recordPriceChange(
    userId: string,
    productId: string,
    previousPrice: number,
    newPrice: number,
    reason: string,
  ): Promise<void> {
    await this.db.insert(retailPriceChanges).values({
      userId,
      productId,
      previousPrice: String(previousPrice),
      newPrice: String(newPrice),
      reason,
    });
  }

  private async findDocumentWith(
    row: DocumentRow,
    db: Pick<AppDatabase, "select">,
  ): Promise<RetailDocument> {
    const items = await db
      .select()
      .from(retailDocumentItems)
      .where(eq(retailDocumentItems.documentId, row.id));
    return this.toDocument(row, items);
  }

  private toDocument(row: DocumentRow, items: DocumentItemRow[]): RetailDocument {
    return {
      id: row.id,
      userId: row.userId,
      kind: row.kind as RetailDocument["kind"],
      status: row.status as RetailDocument["status"],
      title: row.title,
      partyId: row.partyId,
      amount: Number(row.amount),
      deposit: Number(row.deposit),
      dueAt: row.dueAt?.toISOString() ?? null,
      reservedUntil: row.reservedUntil?.toISOString() ?? null,
      payload: row.payload,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variationId: item.variationId,
        name: item.name,
        variationName: item.variationName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        metadata: item.metadata,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCashMovement(row: typeof retailCashMovements.$inferSelect): CashMovement {
    return {
      id: row.id,
      sessionId: row.sessionId,
      type: row.type as CashMovement["type"],
      paymentMethod: row.paymentMethod as CashMovement["paymentMethod"],
      amount: Number(row.amount),
      referenceId: row.referenceId,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toPromotion(row: typeof retailPromotions.$inferSelect): RetailPromotion {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      type: row.type as RetailPromotion["type"],
      value: Number(row.value),
      buyQuantity: row.buyQuantity,
      payQuantity: row.payQuantity,
      productId: row.productId,
      category: row.category,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toBusinessAccount(
    row: typeof retailBusinessAccounts.$inferSelect,
  ): BusinessAccount {
    return {
      id: row.id,
      userId: row.userId,
      clientId: row.clientId,
      kind: row.kind as BusinessAccount["kind"],
      legalName: row.legalName,
      document: row.document,
      contactName: row.contactName,
      creditLimit: Number(row.creditLimit),
      usedCredit: Number(row.usedCredit),
      dueDays: row.dueDays,
      discountPercent: Number(row.discountPercent),
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
