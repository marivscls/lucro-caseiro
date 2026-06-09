import type { Order } from "@lucro-caseiro/contracts";
import { clients, orders } from "@lucro-caseiro/database/schema";
import { and, asc, count, eq, gte, lte, sum } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type {
  CreateOrderData,
  FindAllOrdersOpts,
  IOrdersRepo,
  OrdersStatusAggregate,
  OrdersSummaryOpts,
  UpdateOrderData,
} from "./orders.types";

export class OrdersRepoPg implements IOrdersRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateOrderData): Promise<Order> {
    const [row] = await this.db
      .insert(orders)
      .values({
        userId,
        clientId: data.clientId ?? null,
        title: data.title,
        deliveryDate: data.deliveryDate,
        deliveryTime: data.deliveryTime ?? null,
        status: data.status ?? "pending",
        amount: data.amount != null ? String(data.amount) : null,
        photoUrl: data.photoUrl ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    return this.findById(userId, row!.id) as Promise<Order>;
  }

  async findById(userId: string, id: string): Promise<Order | null> {
    const [row] = await this.db
      .select({ order: orders, clientName: clients.name })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(and(eq(orders.userId, userId), eq(orders.id, id)));

    return row ? this.toOrder(row.order, row.clientName) : null;
  }

  async findAll(userId: string, opts: FindAllOrdersOpts): Promise<Order[]> {
    const conditions = [eq(orders.userId, userId)];
    if (opts.status) conditions.push(eq(orders.status, opts.status));
    if (opts.from) conditions.push(gte(orders.deliveryDate, opts.from));
    if (opts.to) conditions.push(lte(orders.deliveryDate, opts.to));

    const rows = await this.db
      .select({ order: orders, clientName: clients.name })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(asc(orders.deliveryDate), asc(orders.deliveryTime));

    return rows.map((r) => this.toOrder(r.order, r.clientName));
  }

  async update(userId: string, id: string, data: UpdateOrderData): Promise<Order | null> {
    const set: Record<string, unknown> = {};
    if (data.title !== undefined) set.title = data.title;
    if (data.deliveryDate !== undefined) set.deliveryDate = data.deliveryDate;
    if (data.deliveryTime !== undefined) set.deliveryTime = data.deliveryTime ?? null;
    if (data.clientId !== undefined) set.clientId = data.clientId ?? null;
    if (data.amount !== undefined)
      set.amount = data.amount != null ? String(data.amount) : null;
    if (data.photoUrl !== undefined) set.photoUrl = data.photoUrl ?? null;
    if (data.notes !== undefined) set.notes = data.notes ?? null;
    if (data.status !== undefined) set.status = data.status;

    if (Object.keys(set).length === 0) {
      return this.findById(userId, id);
    }

    const [row] = await this.db
      .update(orders)
      .set(set)
      .where(and(eq(orders.userId, userId), eq(orders.id, id)))
      .returning({ id: orders.id });

    return row ? this.findById(userId, id) : null;
  }

  async summarize(
    userId: string,
    opts: OrdersSummaryOpts,
  ): Promise<OrdersStatusAggregate[]> {
    const conditions = [eq(orders.userId, userId)];
    if (opts.status) conditions.push(eq(orders.status, opts.status));
    if (opts.startDate) conditions.push(gte(orders.deliveryDate, opts.startDate));
    if (opts.endDate) conditions.push(lte(orders.deliveryDate, opts.endDate));

    const rows = await this.db
      .select({
        status: orders.status,
        count: count(),
        amount: sum(orders.amount),
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(orders.status);

    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count ?? 0),
      amount: Number(r.amount ?? 0),
    }));
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(orders)
      .where(and(eq(orders.userId, userId), eq(orders.id, id)))
      .returning({ id: orders.id });

    return !!row;
  }

  private toOrder(row: typeof orders.$inferSelect, clientName: string | null): Order {
    return {
      id: row.id,
      userId: row.userId,
      clientId: row.clientId,
      clientName: clientName ?? null,
      title: row.title,
      deliveryDate: row.deliveryDate,
      deliveryTime: row.deliveryTime,
      status: row.status,
      amount: row.amount != null ? Number(row.amount) : null,
      photoUrl: row.photoUrl,
      notes: row.notes,
      saleId: row.saleId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
