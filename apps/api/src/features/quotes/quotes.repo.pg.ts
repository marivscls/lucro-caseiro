import type {
  CreateQuote,
  Quote,
  QuoteItem,
  QuoteStatusType,
} from "@lucro-caseiro/contracts";
import { clients, quotes } from "@lucro-caseiro/database/schema";
import { and, desc, eq, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { FindAllQuotesOpts, IQuotesRepo } from "./quotes.types";

export class QuotesRepoPg implements IQuotesRepo {
  constructor(private db: AppDatabase) {}

  async create(
    userId: string,
    data: CreateQuote & {
      subtotal: number;
      discount: number;
      total: number;
      estimatedCost: number;
      estimatedGain: number;
      estimatedMargin: number;
      status: QuoteStatusType;
    },
  ): Promise<Quote> {
    const [row] = await this.db
      .insert(quotes)
      .values({
        userId,
        clientId: data.clientId ?? null,
        clientName: data.clientName ?? null,
        title: data.title,
        items: data.items,
        subtotal: String(data.subtotal),
        discount: String(data.discount),
        discountType: data.discountType ?? null,
        discountValue: String(data.discountValue ?? 0),
        estimatedCost: String(data.estimatedCost),
        total: String(data.total),
        status: data.status,
        validUntil: data.validUntil ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return this.toQuote(row!);
  }

  async findById(userId: string, id: string): Promise<Quote | null> {
    const [row] = await this.db
      .select()
      .from(quotes)
      .where(and(eq(quotes.userId, userId), eq(quotes.id, id)));
    return row ? await this.withClientName(row) : null;
  }

  async findAll(userId: string, opts: FindAllQuotesOpts) {
    const where = opts.status
      ? and(eq(quotes.userId, userId), eq(quotes.status, opts.status))
      : eq(quotes.userId, userId);

    const rows = await this.db
      .select()
      .from(quotes)
      .where(where)
      .orderBy(desc(quotes.createdAt))
      .limit(opts.limit)
      .offset((opts.page - 1) * opts.limit);

    const [count] = await this.db
      .select({ value: sql<number>`count(*)` })
      .from(quotes)
      .where(where);

    const items = await Promise.all(rows.map((row) => this.withClientName(row)));
    return { items, total: Number(count?.value ?? 0) };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<
      CreateQuote & {
        subtotal: number;
        discount: number;
        total: number;
        estimatedCost: number;
        status: QuoteStatusType;
        orderId: string;
      }
    >,
  ): Promise<Quote | null> {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) set.title = data.title;
    if (data.clientId !== undefined) set.clientId = data.clientId;
    if (data.clientName !== undefined) set.clientName = data.clientName;
    if (data.items !== undefined) set.items = data.items;
    if (data.subtotal !== undefined) set.subtotal = String(data.subtotal);
    if (data.discount !== undefined) set.discount = String(data.discount);
    if (data.discountType !== undefined) set.discountType = data.discountType;
    if (data.discountValue !== undefined)
      set.discountValue = String(data.discountValue);
    if (data.estimatedCost !== undefined)
      set.estimatedCost = String(data.estimatedCost);
    if (data.total !== undefined) set.total = String(data.total);
    if (data.status !== undefined) set.status = data.status;
    if (data.orderId !== undefined) set.orderId = data.orderId;
    if (data.validUntil !== undefined) set.validUntil = data.validUntil;
    if (data.notes !== undefined) set.notes = data.notes;

    const [row] = await this.db
      .update(quotes)
      .set(set)
      .where(and(eq(quotes.userId, userId), eq(quotes.id, id)))
      .returning();
    return row ? await this.withClientName(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(quotes)
      .where(and(eq(quotes.userId, userId), eq(quotes.id, id)))
      .returning({ id: quotes.id });
    return !!row;
  }

  /** clientName salvo no orçamento vence; senão busca o nome do cliente vinculado. */
  private async withClientName(row: typeof quotes.$inferSelect): Promise<Quote> {
    let clientName = row.clientName;
    if (!clientName && row.clientId) {
      const [client] = await this.db
        .select({ name: clients.name })
        .from(clients)
        .where(eq(clients.id, row.clientId));
      clientName = client?.name ?? null;
    }
    return this.toQuote(row, clientName);
  }

  private toQuote(
    row: typeof quotes.$inferSelect,
    clientName: string | null = row.clientName,
  ): Quote {
    return {
      id: row.id,
      userId: row.userId,
      clientId: row.clientId,
      clientName,
      title: row.title,
      items: row.items as QuoteItem[],
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      discountType: row.discountType as Quote["discountType"],
      discountValue: Number(row.discountValue),
      estimatedCost: Number(row.estimatedCost),
      estimatedGain: Number(row.total) - Number(row.estimatedCost),
      estimatedMargin:
        Number(row.total) > 0
          ? ((Number(row.total) - Number(row.estimatedCost)) / Number(row.total)) * 100
          : 0,
      total: Number(row.total),
      status: row.status as Quote["status"],
      validUntil: row.validUntil,
      notes: row.notes,
      orderId: row.orderId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
