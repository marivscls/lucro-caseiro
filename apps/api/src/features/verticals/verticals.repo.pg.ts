import type {
  AppMembership,
  CreateVerticalAsset,
  CreateVerticalDocument,
  PublishedVerticalDomain,
  ResaleSerial,
  UpdateVerticalDocument,
  VerticalAsset,
  VerticalDashboard,
  VerticalDocument,
  VerticalDocumentKind,
} from "@lucro-caseiro/contracts";
import {
  appMemberships,
  clients,
  products,
  resaleSerials,
  sales,
  verticalAssets,
  verticalDocumentItems,
  verticalDocuments,
  verticalEvents,
} from "@lucro-caseiro/database/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import { CLOSED_VERTICAL_STATUSES } from "./verticals.domain";
import type { CreateResaleSerialData, IVerticalsRepo } from "./verticals.types";

type DocumentRow = typeof verticalDocuments.$inferSelect;

export class VerticalsRepoPg implements IVerticalsRepo {
  constructor(private db: AppDatabase) {}

  async touchMembership(
    userId: string,
    brandId: string,
    domain: PublishedVerticalDomain,
  ): Promise<AppMembership> {
    const [row] = await this.db
      .insert(appMemberships)
      .values({ userId, brandId, domain })
      .onConflictDoUpdate({
        target: [appMemberships.userId, appMemberships.brandId],
        set: { status: "active", lastOpenedAt: new Date() },
      })
      .returning();
    return this.toMembership(row!);
  }

  async listMemberships(userId: string): Promise<AppMembership[]> {
    const rows = await this.db
      .select()
      .from(appMemberships)
      .where(eq(appMemberships.userId, userId));
    return rows.map((row) => this.toMembership(row));
  }

  async createDocument(
    userId: string,
    data: CreateVerticalDocument,
    status: string,
  ): Promise<VerticalDocument> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(verticalDocuments)
        .values({
          userId,
          domain: data.domain,
          kind: data.kind,
          status,
          title: data.title,
          clientId: data.clientId ?? null,
          parentId: data.parentId ?? null,
          amount: String(data.amount),
          cost: String(data.cost),
          progress: String(data.progress),
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          dueAt: data.dueAt ? new Date(data.dueAt) : null,
          payload: data.payload,
        })
        .returning();
      if (data.items.length) {
        await tx.insert(verticalDocumentItems).values(
          data.items.map((item) => ({
            documentId: row!.id,
            productId: item.productId ?? null,
            name: item.name,
            category: item.category ?? null,
            quantity: String(item.quantity),
            unit: item.unit,
            unitCost: String(item.unitCost),
            unitPrice: String(item.unitPrice),
            metadata: item.metadata,
          })),
        );
      }
      await tx.insert(verticalEvents).values({
        userId,
        documentId: row!.id,
        type: "created",
        toStatus: status,
      });
      return this.hydrate(row!, tx);
    });
  }

  async findDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
  ): Promise<VerticalDocument | null> {
    const [row] = await this.db
      .select()
      .from(verticalDocuments)
      .where(
        and(
          eq(verticalDocuments.userId, userId),
          eq(verticalDocuments.domain, domain),
          eq(verticalDocuments.id, id),
        ),
      );
    return row ? this.hydrate(row, this.db) : null;
  }

  async listDocuments(
    userId: string,
    domain: PublishedVerticalDomain,
    kind?: VerticalDocumentKind,
    status?: string,
  ): Promise<VerticalDocument[]> {
    const conditions = [
      eq(verticalDocuments.userId, userId),
      eq(verticalDocuments.domain, domain),
    ];
    if (kind) conditions.push(eq(verticalDocuments.kind, kind));
    if (status) conditions.push(eq(verticalDocuments.status, status));
    const rows = await this.db
      .select()
      .from(verticalDocuments)
      .where(and(...conditions))
      .orderBy(sql`${verticalDocuments.updatedAt} DESC`);
    return Promise.all(rows.map((row) => this.hydrate(row, this.db)));
  }

  async updateDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    data: UpdateVerticalDocument & { payload?: Record<string, unknown> },
  ): Promise<VerticalDocument | null> {
    return this.db.transaction(async (tx) => {
      const fields: Record<string, unknown> = {
        updatedAt: new Date(),
        version: sql`${verticalDocuments.version} + 1`,
      };
      for (const key of ["title", "progress", "payload"] as const) {
        if (data[key] !== undefined) fields[key] = data[key];
      }
      if (data.amount !== undefined) fields.amount = String(data.amount);
      if (data.cost !== undefined) fields.cost = String(data.cost);
      if (data.startsAt !== undefined)
        fields.startsAt = data.startsAt ? new Date(data.startsAt) : null;
      if (data.dueAt !== undefined)
        fields.dueAt = data.dueAt ? new Date(data.dueAt) : null;
      const [row] = await tx
        .update(verticalDocuments)
        .set(fields)
        .where(
          and(
            eq(verticalDocuments.userId, userId),
            eq(verticalDocuments.domain, domain),
            eq(verticalDocuments.id, id),
            eq(verticalDocuments.version, data.expectedVersion),
          ),
        )
        .returning();
      if (!row) return null;
      if (data.items) {
        await tx
          .delete(verticalDocumentItems)
          .where(eq(verticalDocumentItems.documentId, id));
        if (data.items.length) {
          await tx.insert(verticalDocumentItems).values(
            data.items.map((item) => ({
              documentId: id,
              productId: item.productId ?? null,
              name: item.name,
              category: item.category ?? null,
              quantity: String(item.quantity),
              unit: item.unit,
              unitCost: String(item.unitCost),
              unitPrice: String(item.unitPrice),
              metadata: item.metadata,
            })),
          );
        }
      }
      await tx.insert(verticalEvents).values({
        userId,
        documentId: id,
        type: "updated",
        payload: { version: row.version },
      });
      return this.hydrate(row, tx);
    });
  }

  async transitionDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    fromStatus: string,
    toStatus: string,
    idempotencyKey: string,
    payload: Record<string, unknown>,
  ): Promise<VerticalDocument | null> {
    return this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: verticalEvents.id })
        .from(verticalEvents)
        .where(
          and(
            eq(verticalEvents.userId, userId),
            eq(verticalEvents.idempotencyKey, idempotencyKey),
          ),
        );
      if (existing) {
        const [current] = await tx
          .select()
          .from(verticalDocuments)
          .where(
            and(
              eq(verticalDocuments.userId, userId),
              eq(verticalDocuments.domain, domain),
              eq(verticalDocuments.id, id),
            ),
          );
        return current ? this.hydrate(current, tx) : null;
      }
      const [row] = await tx
        .update(verticalDocuments)
        .set({
          status: toStatus,
          updatedAt: new Date(),
          version: sql`${verticalDocuments.version} + 1`,
        })
        .where(
          and(
            eq(verticalDocuments.userId, userId),
            eq(verticalDocuments.domain, domain),
            eq(verticalDocuments.id, id),
            eq(verticalDocuments.status, fromStatus),
          ),
        )
        .returning();
      if (!row) return null;
      await tx.insert(verticalEvents).values({
        userId,
        documentId: id,
        type: "status_changed",
        fromStatus,
        toStatus,
        idempotencyKey,
        payload,
      });
      return this.hydrate(row, tx);
    });
  }

  async dashboard(
    userId: string,
    domain: PublishedVerticalDomain,
  ): Promise<VerticalDashboard> {
    const documents = await this.listDocuments(userId, domain);
    const byKind: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const now = Date.now();
    let amount = 0;
    let cost = 0;
    let dueDocuments = 0;
    let openDocuments = 0;
    for (const document of documents) {
      byKind[document.kind] = (byKind[document.kind] ?? 0) + 1;
      byStatus[document.status] = (byStatus[document.status] ?? 0) + 1;
      amount += document.amount;
      cost += document.cost;
      if (!CLOSED_VERTICAL_STATUSES.has(document.status)) openDocuments += 1;
      if (
        document.dueAt &&
        new Date(document.dueAt).getTime() < now &&
        !CLOSED_VERTICAL_STATUSES.has(document.status)
      ) {
        dueDocuments += 1;
      }
    }
    return {
      domain,
      totalDocuments: documents.length,
      openDocuments,
      dueDocuments,
      amount,
      cost,
      projectedProfit: amount - cost,
      byKind,
      byStatus,
    };
  }

  async createAsset(userId: string, data: CreateVerticalAsset): Promise<VerticalAsset> {
    const [row] = await this.db
      .insert(verticalAssets)
      .values({
        userId,
        domain: data.domain,
        clientId: data.clientId ?? null,
        kind: data.kind,
        name: data.name,
        identifier: data.identifier ?? null,
        payload: data.payload,
      })
      .returning();
    return this.toAsset(row!);
  }

  async listAssets(userId: string, domain: "oficina"): Promise<VerticalAsset[]> {
    const rows = await this.db
      .select()
      .from(verticalAssets)
      .where(and(eq(verticalAssets.userId, userId), eq(verticalAssets.domain, domain)));
    return rows.map((row) => this.toAsset(row));
  }

  async createSerial(
    userId: string,
    data: CreateResaleSerialData,
  ): Promise<ResaleSerial> {
    const [row] = await this.db
      .insert(resaleSerials)
      .values({
        userId,
        productId: data.productId,
        variationId: data.variationId ?? null,
        serial: data.serial,
        lotDocumentId: data.lotDocumentId ?? null,
        cost: String(data.cost),
        warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : null,
        metadata: data.metadata,
      })
      .returning();
    return this.toSerial(row!);
  }

  async listSerials(userId: string, status?: string): Promise<ResaleSerial[]> {
    const conditions = [eq(resaleSerials.userId, userId)];
    if (status) conditions.push(eq(resaleSerials.status, status));
    const rows = await this.db
      .select()
      .from(resaleSerials)
      .where(and(...conditions));
    return rows.map((row) => this.toSerial(row));
  }

  async updateSerialStatus(
    userId: string,
    id: string,
    expectedStatus: string,
    status: string,
    saleId?: string,
  ): Promise<ResaleSerial | null> {
    const [row] = await this.db
      .update(resaleSerials)
      .set({
        status,
        saleId: saleId ?? null,
        soldAt: status === "sold" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(resaleSerials.userId, userId),
          eq(resaleSerials.id, id),
          eq(resaleSerials.status, expectedStatus),
        ),
      )
      .returning();
    return row ? this.toSerial(row) : null;
  }

  async ownsClient(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, id)));
    return !!row;
  }

  async ownsProducts(userId: string, ids: string[]): Promise<boolean> {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) return true;
    const rows = await this.db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.userId, userId), inArray(products.id, uniqueIds)));
    return rows.length === uniqueIds.length;
  }

  async ownsAsset(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: verticalAssets.id })
      .from(verticalAssets)
      .where(
        and(
          eq(verticalAssets.userId, userId),
          eq(verticalAssets.domain, "oficina"),
          eq(verticalAssets.id, id),
        ),
      );
    return !!row;
  }

  async ownsDocumentKind(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    kind?: VerticalDocumentKind,
  ): Promise<boolean> {
    const conditions = [
      eq(verticalDocuments.userId, userId),
      eq(verticalDocuments.domain, domain),
      eq(verticalDocuments.id, id),
    ];
    if (kind) conditions.push(eq(verticalDocuments.kind, kind));
    const [row] = await this.db
      .select({ id: verticalDocuments.id })
      .from(verticalDocuments)
      .where(and(...conditions));
    return !!row;
  }

  async ownsSale(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: sales.id })
      .from(sales)
      .where(and(eq(sales.userId, userId), eq(sales.id, id)));
    return !!row;
  }

  private async hydrate(
    row: DocumentRow,
    db: Pick<AppDatabase, "select">,
  ): Promise<VerticalDocument> {
    const [items, events] = await Promise.all([
      db
        .select()
        .from(verticalDocumentItems)
        .where(eq(verticalDocumentItems.documentId, row.id)),
      db
        .select()
        .from(verticalEvents)
        .where(eq(verticalEvents.documentId, row.id))
        .orderBy(verticalEvents.createdAt),
    ]);
    return {
      id: row.id,
      userId: row.userId,
      domain: row.domain as PublishedVerticalDomain,
      kind: row.kind as VerticalDocument["kind"],
      status: row.status,
      title: row.title,
      clientId: row.clientId,
      parentId: row.parentId,
      amount: Number(row.amount),
      cost: Number(row.cost),
      progress: Number(row.progress),
      startsAt: row.startsAt?.toISOString() ?? null,
      dueAt: row.dueAt?.toISOString() ?? null,
      payload: row.payload,
      version: row.version,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        category: item.category ?? undefined,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitCost: Number(item.unitCost),
        unitPrice: Number(item.unitPrice),
        metadata: item.metadata,
      })),
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        payload: event.payload,
        createdAt: event.createdAt.toISOString(),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toMembership(row: typeof appMemberships.$inferSelect): AppMembership {
    return {
      id: row.id,
      userId: row.userId,
      brandId: row.brandId,
      domain: row.domain as PublishedVerticalDomain,
      status: row.status as AppMembership["status"],
      onboardedAt: row.onboardedAt?.toISOString() ?? null,
      lastOpenedAt: row.lastOpenedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toAsset(row: typeof verticalAssets.$inferSelect): VerticalAsset {
    return {
      id: row.id,
      userId: row.userId,
      domain: "oficina",
      clientId: row.clientId,
      kind: row.kind as VerticalAsset["kind"],
      name: row.name,
      identifier: row.identifier,
      payload: row.payload as VerticalAsset["payload"],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toSerial(row: typeof resaleSerials.$inferSelect): ResaleSerial {
    return {
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      variationId: row.variationId,
      serial: row.serial,
      status: row.status as ResaleSerial["status"],
      lotDocumentId: row.lotDocumentId,
      saleId: row.saleId,
      cost: Number(row.cost),
      warrantyUntil: row.warrantyUntil?.toISOString() ?? null,
      metadata: row.metadata,
      soldAt: row.soldAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
