import type {
  CreateService,
  Order,
  Service,
  UpdateService,
} from "@lucro-caseiro/contracts";
import { clients, orders, services } from "@lucro-caseiro/database/schema";
import { and, asc, count, eq, gte, lte, ne, sql, sum } from "drizzle-orm";

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
        serviceId: data.serviceId ?? null,
        durationMinutes:
          data.durationMinutes != null ? String(data.durationMinutes) : null,
        title: data.title,
        deliveryDate: data.deliveryDate,
        deliveryTime: data.deliveryTime ?? null,
        status: data.status ?? "pending",
        amount: data.amount != null ? String(data.amount) : null,
        deposit: data.deposit != null ? String(data.deposit) : null,
        theme: data.theme ?? null,
        honoree: data.honoree ?? null,
        colors: data.colors ?? null,
        photoUrl: data.photoUrl ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    return this.findById(userId, row!.id) as Promise<Order>;
  }

  async findById(userId: string, id: string): Promise<Order | null> {
    const [row] = await this.db
      .select({
        order: orders,
        clientName: clients.name,
        serviceName: services.name,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .leftJoin(services, eq(orders.serviceId, services.id))
      .where(and(eq(orders.userId, userId), eq(orders.id, id)));

    return row ? this.toOrder(row.order, row.clientName, row.serviceName) : null;
  }

  async findAll(userId: string, opts: FindAllOrdersOpts): Promise<Order[]> {
    const conditions = [eq(orders.userId, userId)];
    if (opts.status) conditions.push(eq(orders.status, opts.status));
    if (opts.from) conditions.push(gte(orders.deliveryDate, opts.from));
    if (opts.to) conditions.push(lte(orders.deliveryDate, opts.to));

    const rows = await this.db
      .select({
        order: orders,
        clientName: clients.name,
        serviceName: services.name,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .leftJoin(services, eq(orders.serviceId, services.id))
      .where(and(...conditions))
      .orderBy(asc(orders.deliveryDate), asc(orders.deliveryTime));

    return rows.map((r) => this.toOrder(r.order, r.clientName, r.serviceName));
  }

  async update(userId: string, id: string, data: UpdateOrderData): Promise<Order | null> {
    const set: Record<string, unknown> = {};
    if (data.title !== undefined) set.title = data.title;
    if (data.deliveryDate !== undefined) set.deliveryDate = data.deliveryDate;
    if (data.deliveryTime !== undefined) set.deliveryTime = data.deliveryTime ?? null;
    if (data.clientId !== undefined) set.clientId = data.clientId ?? null;
    if (data.serviceId !== undefined) set.serviceId = data.serviceId ?? null;
    if (data.durationMinutes !== undefined)
      set.durationMinutes =
        data.durationMinutes != null ? String(data.durationMinutes) : null;
    if (data.amount !== undefined)
      set.amount = data.amount != null ? String(data.amount) : null;
    if (data.deposit !== undefined)
      set.deposit = data.deposit != null ? String(data.deposit) : null;
    if (data.theme !== undefined) set.theme = data.theme ?? null;
    if (data.honoree !== undefined) set.honoree = data.honoree ?? null;
    if (data.colors !== undefined) set.colors = data.colors ?? null;
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
        deposit: sum(orders.deposit),
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(orders.status);

    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count ?? 0),
      amount: Number(r.amount ?? 0),
      deposit: Number(r.deposit ?? 0),
    }));
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(orders)
      .where(and(eq(orders.userId, userId), eq(orders.id, id)))
      .returning({ id: orders.id });

    return !!row;
  }

  async listServices(userId: string): Promise<Service[]> {
    const rows = await this.db
      .select()
      .from(services)
      .where(eq(services.userId, userId))
      .orderBy(asc(services.name));
    return rows.map((row) => this.toService(row));
  }

  async findServiceByName(
    userId: string,
    name: string,
    excludeId?: string,
  ): Promise<Service | null> {
    const normalizedName = name.trim().toLocaleLowerCase("pt-BR");
    const conditions = [
      eq(services.userId, userId),
      sql`lower(trim(${services.name})) = ${normalizedName}`,
    ];
    if (excludeId) conditions.push(ne(services.id, excludeId));
    const [row] = await this.db
      .select()
      .from(services)
      .where(and(...conditions))
      .limit(1);
    return row ? this.toService(row) : null;
  }

  async createService(userId: string, data: CreateService): Promise<Service> {
    const [row] = await this.db
      .insert(services)
      .values({
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        durationMinutes: data.durationMinutes,
        defaultPrice: data.defaultPrice == null ? null : String(data.defaultPrice),
        materialCost: String(data.materialCost ?? 0),
        hourlyRate: String(data.hourlyRate ?? 0),
        otherCost: String(data.otherCost ?? 0),
        fixedCostShare: String(data.fixedCostShare ?? 0),
        markupPercent: String(data.markupPercent ?? 0),
        feesPercent: String(data.feesPercent ?? 0),
        active: data.active ?? true,
      })
      .returning();
    return this.toService(row!);
  }

  async updateService(
    userId: string,
    id: string,
    data: UpdateService,
  ): Promise<Service | null> {
    const set: Record<string, unknown> = {};
    if (data.name !== undefined) set.name = data.name.trim();
    if (data.description !== undefined)
      set.description = data.description?.trim() || null;
    if (data.durationMinutes !== undefined) set.durationMinutes = data.durationMinutes;
    if (data.defaultPrice !== undefined)
      set.defaultPrice = data.defaultPrice == null ? null : String(data.defaultPrice);
    if (data.materialCost !== undefined) set.materialCost = String(data.materialCost);
    if (data.hourlyRate !== undefined) set.hourlyRate = String(data.hourlyRate);
    if (data.otherCost !== undefined) set.otherCost = String(data.otherCost);
    if (data.fixedCostShare !== undefined)
      set.fixedCostShare = String(data.fixedCostShare);
    if (data.markupPercent !== undefined) set.markupPercent = String(data.markupPercent);
    if (data.feesPercent !== undefined) set.feesPercent = String(data.feesPercent);
    if (data.active !== undefined) set.active = data.active;
    if (Object.keys(set).length === 0) {
      const [row] = await this.db
        .select()
        .from(services)
        .where(and(eq(services.userId, userId), eq(services.id, id)));
      return row ? this.toService(row) : null;
    }
    const [row] = await this.db
      .update(services)
      .set(set)
      .where(and(eq(services.userId, userId), eq(services.id, id)))
      .returning();
    return row ? this.toService(row) : null;
  }

  async hasScheduleConflict(
    userId: string,
    date: string,
    time: string,
    durationMinutes: number,
    excludeOrderId?: string,
  ): Promise<boolean> {
    const rows = await this.findAll(userId, { from: date, to: date });
    const start = minutesOfDay(time);
    const end = start + durationMinutes;
    return rows.some((order) => {
      if (
        order.id === excludeOrderId ||
        order.status === "cancelled" ||
        !order.deliveryTime
      ) {
        return false;
      }
      const occupiedStart = minutesOfDay(order.deliveryTime);
      const occupiedEnd = occupiedStart + (order.durationMinutes ?? 60);
      return start < occupiedEnd && end > occupiedStart;
    });
  }

  private toService(row: typeof services.$inferSelect): Service {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      durationMinutes: row.durationMinutes,
      defaultPrice: row.defaultPrice == null ? null : Number(row.defaultPrice),
      materialCost: Number(row.materialCost),
      hourlyRate: Number(row.hourlyRate),
      otherCost: Number(row.otherCost),
      fixedCostShare: Number(row.fixedCostShare),
      markupPercent: Number(row.markupPercent),
      feesPercent: Number(row.feesPercent),
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toOrder(
    row: typeof orders.$inferSelect,
    clientName: string | null,
    serviceName: string | null,
  ): Order {
    return {
      id: row.id,
      userId: row.userId,
      clientId: row.clientId,
      clientName: clientName ?? null,
      serviceId: row.serviceId,
      serviceName,
      durationMinutes: row.durationMinutes != null ? Number(row.durationMinutes) : null,
      title: row.title,
      deliveryDate: row.deliveryDate,
      deliveryTime: row.deliveryTime,
      status: row.status,
      amount: row.amount != null ? Number(row.amount) : null,
      deposit: row.deposit != null ? Number(row.deposit) : null,
      theme: row.theme,
      honoree: row.honoree,
      colors: row.colors,
      photoUrl: row.photoUrl,
      notes: row.notes,
      saleId: row.saleId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function minutesOfDay(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
