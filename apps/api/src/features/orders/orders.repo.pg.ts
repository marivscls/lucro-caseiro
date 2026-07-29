import type {
  CreateService,
  Order,
  PurchaseServicePackage,
  Service,
  ServiceBookingRequest,
  ServiceBookingRequestStatus,
  ServiceInsights,
  ServicePackageInput,
  ServicePackagePurchase,
  UpdateService,
} from "@lucro-caseiro/contracts";
import {
  clients,
  orders,
  publicServiceBookingRequests,
  serviceAddOns,
  servicePackagePurchases,
  servicePackages,
  servicePackageSessionUsages,
  services,
  serviceVariations,
} from "@lucro-caseiro/database/schema";
import { and, asc, count, desc, eq, gte, lte, lt, ne, sql, sum } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type {
  CreateOrderData,
  FindAllOrdersOpts,
  IOrdersRepo,
  OrdersStatusAggregate,
  OrdersSummaryOpts,
  UpdateOrderData,
} from "./orders.types";

function resolvedAppointmentStatus(
  order: Order,
): NonNullable<Order["appointmentStatus"]> {
  if (order.appointmentStatus) return order.appointmentStatus;
  if (order.status === "done") return "completed";
  if (order.status === "cancelled") return "cancelled";
  return "scheduled";
}

export class OrdersRepoPg implements IOrdersRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateOrderData): Promise<Order> {
    const [row] = await this.db
      .insert(orders)
      .values({
        userId,
        clientId: data.clientId ?? null,
        serviceId: data.serviceId ?? null,
        serviceVariationId: data.serviceVariationId ?? null,
        serviceVariationName: data.serviceVariationName ?? null,
        serviceAddOnIds: data.serviceAddOnIds ?? [],
        serviceAddOnNames: data.serviceAddOnNames ?? [],
        servicePackagePurchaseId: data.servicePackagePurchaseId ?? null,
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
        appointmentStatus: data.appointmentStatus ?? null,
        locationMode: data.locationMode ?? null,
        locationDetails: data.locationDetails ?? null,
        actualCost: data.actualCost != null ? String(data.actualCost) : null,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        saleId: data.saleId ?? null,
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
    if (data.serviceVariationId !== undefined)
      set.serviceVariationId = data.serviceVariationId ?? null;
    if (data.serviceVariationName !== undefined)
      set.serviceVariationName = data.serviceVariationName ?? null;
    if (data.serviceAddOnIds !== undefined) set.serviceAddOnIds = data.serviceAddOnIds;
    if (data.serviceAddOnNames !== undefined)
      set.serviceAddOnNames = data.serviceAddOnNames;
    if (data.servicePackagePurchaseId !== undefined)
      set.servicePackagePurchaseId = data.servicePackagePurchaseId ?? null;
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
    if (data.appointmentStatus !== undefined)
      set.appointmentStatus = data.appointmentStatus ?? null;
    if (data.locationMode !== undefined) set.locationMode = data.locationMode ?? null;
    if (data.locationDetails !== undefined)
      set.locationDetails = data.locationDetails ?? null;
    if (data.actualCost !== undefined)
      set.actualCost = data.actualCost != null ? String(data.actualCost) : null;
    if (data.completedAt !== undefined)
      set.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    if (data.saleId !== undefined) set.saleId = data.saleId ?? null;
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
    return Promise.all(rows.map((row) => this.toService(row)));
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

  async findServiceById(userId: string, id: string): Promise<Service | null> {
    const [row] = await this.db
      .select()
      .from(services)
      .where(and(eq(services.userId, userId), eq(services.id, id)));
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
        locationMode: data.locationMode ?? "flexible",
        bufferMinutes: data.bufferMinutes ?? 0,
        publicEnabled: data.publicEnabled ?? false,
        bookingInstructions: data.bookingInstructions?.trim() || null,
        active: data.active ?? true,
      })
      .returning();
    await this.syncServiceOfferings(userId, row!.id, data);
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
    if (data.locationMode !== undefined) set.locationMode = data.locationMode;
    if (data.bufferMinutes !== undefined) set.bufferMinutes = data.bufferMinutes;
    if (data.publicEnabled !== undefined) set.publicEnabled = data.publicEnabled;
    if (data.bookingInstructions !== undefined)
      set.bookingInstructions = data.bookingInstructions?.trim() || null;
    if (data.active !== undefined) set.active = data.active;
    if (Object.keys(set).length === 0) {
      const [row] = await this.db
        .select()
        .from(services)
        .where(and(eq(services.userId, userId), eq(services.id, id)));
      if (row) await this.syncServiceOfferings(userId, id, data);
      return row ? this.toService(row) : null;
    }
    const [row] = await this.db
      .update(services)
      .set(set)
      .where(and(eq(services.userId, userId), eq(services.id, id)))
      .returning();
    if (row) await this.syncServiceOfferings(userId, id, data);
    return row ? this.toService(row) : null;
  }

  async findServicePackage(
    userId: string,
    packageId: string,
  ): Promise<(ServicePackageInput & { id: string; serviceId: string }) | null> {
    const [row] = await this.db
      .select()
      .from(servicePackages)
      .where(and(eq(servicePackages.userId, userId), eq(servicePackages.id, packageId)));
    return row
      ? {
          id: row.id,
          serviceId: row.serviceId,
          name: row.name,
          sessions: row.sessions,
          price: Number(row.price),
          validityDays: row.validityDays,
          recurrenceDays: row.recurrenceDays,
          active: row.active,
        }
      : null;
  }

  async createPackagePurchase(
    userId: string,
    packageId: string,
    serviceId: string,
    data: PurchaseServicePackage,
    packageData: ServicePackageInput,
    expiresAt: string,
  ): Promise<ServicePackagePurchase> {
    const [row] = await this.db
      .insert(servicePackagePurchases)
      .values({
        userId,
        packageId,
        serviceId,
        clientId: data.clientId,
        sessionsTotal: packageData.sessions,
        pricePaid: String(data.pricePaid ?? packageData.price),
        purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : new Date(),
        expiresAt,
      })
      .returning();
    return (await this.listPackagePurchases(userId)).find((item) => item.id === row!.id)!;
  }

  async updatePackagePurchaseSale(
    userId: string,
    purchaseId: string,
    saleId: string,
  ): Promise<ServicePackagePurchase | null> {
    const [row] = await this.db
      .update(servicePackagePurchases)
      .set({ saleId })
      .where(
        and(
          eq(servicePackagePurchases.userId, userId),
          eq(servicePackagePurchases.id, purchaseId),
        ),
      )
      .returning({ id: servicePackagePurchases.id });
    if (!row) return null;
    return (
      (await this.listPackagePurchases(userId)).find((item) => item.id === purchaseId) ??
      null
    );
  }

  async listPackagePurchases(
    userId: string,
    opts: { clientId?: string; serviceId?: string } = {},
  ): Promise<ServicePackagePurchase[]> {
    const conditions = [eq(servicePackagePurchases.userId, userId)];
    if (opts.clientId) {
      conditions.push(eq(servicePackagePurchases.clientId, opts.clientId));
    }
    if (opts.serviceId) {
      conditions.push(eq(servicePackagePurchases.serviceId, opts.serviceId));
    }
    const rows = await this.db
      .select({
        purchase: servicePackagePurchases,
        packageName: servicePackages.name,
        serviceName: services.name,
        clientName: clients.name,
      })
      .from(servicePackagePurchases)
      .innerJoin(
        servicePackages,
        eq(servicePackagePurchases.packageId, servicePackages.id),
      )
      .innerJoin(services, eq(servicePackagePurchases.serviceId, services.id))
      .innerJoin(clients, eq(servicePackagePurchases.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(servicePackagePurchases.purchasedAt));
    return rows.map((row) =>
      this.toPackagePurchase(
        row.purchase,
        row.packageName,
        row.serviceName,
        row.clientName,
      ),
    );
  }

  async consumePackageSession(
    userId: string,
    purchaseId: string,
    orderId: string,
  ): Promise<ServicePackagePurchase | null> {
    const consumed = await this.db.transaction(async (tx) => {
      const [usage] = await tx
        .insert(servicePackageSessionUsages)
        .values({ userId, purchaseId, orderId })
        .onConflictDoNothing({ target: servicePackageSessionUsages.orderId })
        .returning({ id: servicePackageSessionUsages.id });
      if (!usage) {
        const [existingUsage] = await tx
          .select({ purchaseId: servicePackageSessionUsages.purchaseId })
          .from(servicePackageSessionUsages)
          .where(
            and(
              eq(servicePackageSessionUsages.userId, userId),
              eq(servicePackageSessionUsages.orderId, orderId),
            ),
          );
        return existingUsage?.purchaseId === purchaseId;
      }

      const [updated] = await tx
        .update(servicePackagePurchases)
        .set({
          sessionsUsed: sql`${servicePackagePurchases.sessionsUsed} + 1`,
          status: sql`CASE
            WHEN ${servicePackagePurchases.sessionsUsed} + 1 >= ${servicePackagePurchases.sessionsTotal}
            THEN 'completed'
            ELSE 'active'
          END`,
        })
        .where(
          and(
            eq(servicePackagePurchases.userId, userId),
            eq(servicePackagePurchases.id, purchaseId),
            eq(servicePackagePurchases.status, "active"),
            gte(servicePackagePurchases.expiresAt, new Date().toISOString().slice(0, 10)),
            lt(
              servicePackagePurchases.sessionsUsed,
              servicePackagePurchases.sessionsTotal,
            ),
          ),
        )
        .returning({ id: servicePackagePurchases.id });
      if (updated) return true;

      await tx
        .delete(servicePackageSessionUsages)
        .where(eq(servicePackageSessionUsages.id, usage.id));
      return false;
    });
    if (!consumed) return null;
    return (
      (await this.listPackagePurchases(userId)).find((item) => item.id === purchaseId) ??
      null
    );
  }

  async getServiceInsights(userId: string, serviceId: string): Promise<ServiceInsights> {
    const service = await this.findServiceById(userId, serviceId);
    const appointments = await this.findAll(userId, {});
    const related = appointments.filter((item) => item.serviceId === serviceId);
    const completed = related.filter(
      (item) => item.appointmentStatus === "completed" || item.status === "done",
    );
    const estimatedCost =
      (service?.materialCost ?? 0) +
      (service?.otherCost ?? 0) +
      (service?.fixedCostShare ?? 0) +
      ((service?.hourlyRate ?? 0) * (service?.durationMinutes ?? 0)) / 60;
    const revenue = completed.reduce((total, item) => total + (item.amount ?? 0), 0);
    const cost = completed.reduce(
      (total, item) => total + (item.actualCost ?? estimatedCost),
      0,
    );
    const totalHours = completed.reduce(
      (total, item) => total + (item.durationMinutes ?? 0) / 60,
      0,
    );
    const clientsMap = new Map<
      string,
      {
        clientId: string | null;
        clientName: string;
        appointments: number;
        revenue: number;
      }
    >();
    for (const item of completed) {
      const key = item.clientId ?? `avulso:${item.clientName ?? "Cliente avulso"}`;
      const current = clientsMap.get(key);
      clientsMap.set(key, {
        clientId: item.clientId,
        clientName: item.clientName ?? "Cliente avulso",
        appointments: (current?.appointments ?? 0) + 1,
        revenue: (current?.revenue ?? 0) + (item.amount ?? 0),
      });
    }
    const packagePurchases = await this.listPackagePurchases(userId, { serviceId });
    const bookingRequests = await this.listBookingRequests(userId, serviceId);
    const profit = revenue - cost;
    return {
      serviceId,
      totalAppointments: related.length,
      completedAppointments: completed.length,
      cancelledAppointments: related.filter(
        (item) => item.appointmentStatus === "cancelled",
      ).length,
      noShowAppointments: related.filter((item) => item.appointmentStatus === "no_show")
        .length,
      revenue,
      cost,
      profit,
      averageTicket: completed.length ? revenue / completed.length : 0,
      totalHours,
      profitPerHour: totalHours > 0 ? profit / totalHours : 0,
      topClients: [...clientsMap.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      recentAppointments: related
        .slice()
        .sort((a, b) =>
          `${b.deliveryDate}${b.deliveryTime ?? ""}`.localeCompare(
            `${a.deliveryDate}${a.deliveryTime ?? ""}`,
          ),
        )
        .slice(0, 20)
        .map((item) => ({
          id: item.id,
          clientName: item.clientName ?? "Cliente avulso",
          deliveryDate: item.deliveryDate,
          deliveryTime: item.deliveryTime,
          appointmentStatus: resolvedAppointmentStatus(item),
          amount: item.amount ?? 0,
          actualCost: item.actualCost ?? estimatedCost,
        })),
      packagePurchases,
      bookingRequests,
    };
  }

  async listBookingRequests(
    userId: string,
    serviceId: string,
  ): Promise<ServiceBookingRequest[]> {
    const rows = await this.db
      .select()
      .from(publicServiceBookingRequests)
      .where(
        and(
          eq(publicServiceBookingRequests.userId, userId),
          eq(publicServiceBookingRequests.serviceId, serviceId),
        ),
      )
      .orderBy(desc(publicServiceBookingRequests.createdAt));
    return rows.map((row) => this.toBookingRequest(row));
  }

  async updateBookingRequestStatus(
    userId: string,
    id: string,
    status: ServiceBookingRequestStatus,
  ): Promise<ServiceBookingRequest | null> {
    const [row] = await this.db
      .update(publicServiceBookingRequests)
      .set({ status })
      .where(
        and(
          eq(publicServiceBookingRequests.userId, userId),
          eq(publicServiceBookingRequests.id, id),
        ),
      )
      .returning();
    return row ? this.toBookingRequest(row) : null;
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

  private async syncServiceOfferings(
    userId: string,
    serviceId: string,
    data: CreateService | UpdateService,
  ): Promise<void> {
    if (data.variations !== undefined) {
      await this.db
        .update(serviceVariations)
        .set({ active: false })
        .where(
          and(
            eq(serviceVariations.userId, userId),
            eq(serviceVariations.serviceId, serviceId),
          ),
        );
      for (const item of data.variations) {
        if (item.id) {
          await this.db
            .update(serviceVariations)
            .set({
              name: item.name.trim(),
              durationMinutes: item.durationMinutes,
              price: String(item.price),
              active: item.active ?? true,
            })
            .where(
              and(
                eq(serviceVariations.userId, userId),
                eq(serviceVariations.serviceId, serviceId),
                eq(serviceVariations.id, item.id),
              ),
            );
        } else {
          await this.db.insert(serviceVariations).values({
            userId,
            serviceId,
            name: item.name.trim(),
            durationMinutes: item.durationMinutes,
            price: String(item.price),
            active: item.active ?? true,
          });
        }
      }
    }
    if (data.addOns !== undefined) {
      await this.db
        .update(serviceAddOns)
        .set({ active: false })
        .where(
          and(eq(serviceAddOns.userId, userId), eq(serviceAddOns.serviceId, serviceId)),
        );
      for (const item of data.addOns) {
        if (item.id) {
          await this.db
            .update(serviceAddOns)
            .set({
              name: item.name.trim(),
              durationMinutes: item.durationMinutes,
              price: String(item.price),
              active: item.active ?? true,
            })
            .where(
              and(
                eq(serviceAddOns.userId, userId),
                eq(serviceAddOns.serviceId, serviceId),
                eq(serviceAddOns.id, item.id),
              ),
            );
        } else {
          await this.db.insert(serviceAddOns).values({
            userId,
            serviceId,
            name: item.name.trim(),
            durationMinutes: item.durationMinutes,
            price: String(item.price),
            active: item.active ?? true,
          });
        }
      }
    }
    if (data.packages !== undefined) {
      await this.db
        .update(servicePackages)
        .set({ active: false })
        .where(
          and(
            eq(servicePackages.userId, userId),
            eq(servicePackages.serviceId, serviceId),
          ),
        );
      for (const item of data.packages) {
        if (item.id) {
          await this.db
            .update(servicePackages)
            .set({
              name: item.name.trim(),
              sessions: item.sessions,
              price: String(item.price),
              validityDays: item.validityDays,
              recurrenceDays: item.recurrenceDays ?? null,
              active: item.active ?? true,
            })
            .where(
              and(
                eq(servicePackages.userId, userId),
                eq(servicePackages.serviceId, serviceId),
                eq(servicePackages.id, item.id),
              ),
            );
        } else {
          await this.db.insert(servicePackages).values({
            userId,
            serviceId,
            name: item.name.trim(),
            sessions: item.sessions,
            price: String(item.price),
            validityDays: item.validityDays,
            recurrenceDays: item.recurrenceDays ?? null,
            active: item.active ?? true,
          });
        }
      }
    }
  }

  private async toService(row: typeof services.$inferSelect): Promise<Service> {
    const [variations, addOns, packages] = await Promise.all([
      this.db
        .select()
        .from(serviceVariations)
        .where(
          and(
            eq(serviceVariations.userId, row.userId),
            eq(serviceVariations.serviceId, row.id),
          ),
        )
        .orderBy(asc(serviceVariations.name)),
      this.db
        .select()
        .from(serviceAddOns)
        .where(
          and(eq(serviceAddOns.userId, row.userId), eq(serviceAddOns.serviceId, row.id)),
        )
        .orderBy(asc(serviceAddOns.name)),
      this.db
        .select()
        .from(servicePackages)
        .where(
          and(
            eq(servicePackages.userId, row.userId),
            eq(servicePackages.serviceId, row.id),
          ),
        )
        .orderBy(asc(servicePackages.name)),
    ]);
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
      locationMode: row.locationMode as Service["locationMode"],
      bufferMinutes: row.bufferMinutes,
      publicEnabled: row.publicEnabled,
      bookingInstructions: row.bookingInstructions,
      active: row.active,
      variations: variations.map((item) => ({
        id: item.id,
        name: item.name,
        durationMinutes: item.durationMinutes,
        price: Number(item.price),
        active: item.active,
      })),
      addOns: addOns.map((item) => ({
        id: item.id,
        name: item.name,
        durationMinutes: item.durationMinutes,
        price: Number(item.price),
        active: item.active,
      })),
      packages: packages.map((item) => ({
        id: item.id,
        name: item.name,
        sessions: item.sessions,
        price: Number(item.price),
        validityDays: item.validityDays,
        recurrenceDays: item.recurrenceDays,
        active: item.active,
      })),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toPackagePurchase(
    row: typeof servicePackagePurchases.$inferSelect,
    packageName: string,
    serviceName: string,
    clientName: string,
  ): ServicePackagePurchase {
    const expired =
      row.status === "active" && row.expiresAt < new Date().toISOString().slice(0, 10);
    return {
      id: row.id,
      userId: row.userId,
      packageId: row.packageId,
      packageName,
      serviceId: row.serviceId,
      serviceName,
      clientId: row.clientId,
      clientName,
      sessionsTotal: row.sessionsTotal,
      sessionsUsed: row.sessionsUsed,
      pricePaid: Number(row.pricePaid),
      purchasedAt: row.purchasedAt.toISOString(),
      expiresAt: row.expiresAt,
      status: expired ? "expired" : (row.status as ServicePackagePurchase["status"]),
      saleId: row.saleId,
    };
  }

  private toBookingRequest(
    row: typeof publicServiceBookingRequests.$inferSelect,
  ): ServiceBookingRequest {
    return {
      id: row.id,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      clientName: row.clientName,
      phone: row.phone,
      desiredDate: row.desiredDate,
      desiredTime: row.desiredTime,
      locationMode: row.locationMode as ServiceBookingRequest["locationMode"],
      notes: row.notes,
      status: row.status as ServiceBookingRequest["status"],
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
      serviceVariationId: row.serviceVariationId,
      serviceVariationName: row.serviceVariationName,
      serviceAddOnIds: row.serviceAddOnIds,
      serviceAddOnNames: row.serviceAddOnNames,
      servicePackagePurchaseId: row.servicePackagePurchaseId,
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
      appointmentStatus: row.appointmentStatus as Order["appointmentStatus"],
      locationMode: row.locationMode as Order["locationMode"],
      locationDetails: row.locationDetails,
      actualCost: row.actualCost == null ? null : Number(row.actualCost),
      completedAt: row.completedAt?.toISOString() ?? null,
      saleId: row.saleId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function minutesOfDay(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
