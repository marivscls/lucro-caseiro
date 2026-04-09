import type { Sale, SaleStatus } from "@lucro-caseiro/contracts";
import { clients, products, saleItems, sales } from "@lucro-caseiro/database/schema";
import { and, between, count, eq, sql, sum } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type {
  CreateSaleData,
  DaySummary,
  FindAllSalesOpts,
  ISalesRepo,
  UpdateSaleData,
} from "./sales.types";

type PaymentMethodColumn = "pix" | "cash" | "card" | "credit" | "transfer";

export class SalesRepoPg implements ISalesRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateSaleData, total: number): Promise<Sale> {
    const [saleRow] = await this.db
      .insert(sales)
      .values({
        userId,
        clientId: data.clientId ?? null,
        paymentMethod: data.paymentMethod as PaymentMethodColumn,
        total: String(total),
        notes: data.notes ?? null,
        soldAt: data.soldAt ? new Date(data.soldAt) : new Date(),
      })
      .returning();

    const sale = saleRow!;

    const itemRows = await this.db
      .insert(saleItems)
      .values(
        data.items.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          subtotal: String(item.quantity * item.unitPrice),
        })),
      )
      .returning();

    return this.toSale(sale, itemRows, null);
  }

  async update(
    userId: string,
    id: string,
    data: UpdateSaleData,
    total: number,
  ): Promise<Sale | null> {
    const setFields: Record<string, unknown> = { total: String(total) };

    if (data.clientId !== undefined) {
      setFields.clientId = data.clientId ?? null;
    }
    if (data.paymentMethod !== undefined) {
      setFields.paymentMethod = data.paymentMethod as PaymentMethodColumn;
    }
    if (data.notes !== undefined) {
      setFields.notes = data.notes ?? null;
    }

    const [row] = await this.db
      .update(sales)
      .set(setFields)
      .where(and(eq(sales.userId, userId), eq(sales.id, id)))
      .returning();

    if (!row) return null;

    if (data.items) {
      await this.db.delete(saleItems).where(eq(saleItems.saleId, id));

      await this.db.insert(saleItems).values(
        data.items.map((item) => ({
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          subtotal: String(item.quantity * item.unitPrice),
        })),
      );
    }

    return this.findById(userId, id);
  }

  async findById(userId: string, id: string): Promise<Sale | null> {
    const [saleRow] = await this.db
      .select()
      .from(sales)
      .where(and(eq(sales.userId, userId), eq(sales.id, id)));

    if (!saleRow) return null;

    const itemRows = await this.db
      .select({
        id: saleItems.id,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        subtotal: saleItems.subtotal,
        productName: products.name,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, saleRow.id));

    let clientName: string | null = null;
    if (saleRow.clientId) {
      const [clientRow] = await this.db
        .select({ name: clients.name })
        .from(clients)
        .where(eq(clients.id, saleRow.clientId));
      clientName = clientRow?.name ?? null;
    }

    return this.toSaleWithJoins(saleRow, itemRows, clientName);
  }

  async findAll(
    userId: string,
    opts: FindAllSalesOpts,
  ): Promise<{ items: Sale[]; total: number }> {
    const conditions = [eq(sales.userId, userId)];

    if (opts.status) {
      conditions.push(eq(sales.status, opts.status));
    }

    if (opts.clientId) {
      conditions.push(eq(sales.clientId, opts.clientId));
    }

    if (opts.paymentMethod) {
      conditions.push(eq(sales.paymentMethod, opts.paymentMethod as PaymentMethodColumn));
    }

    if (opts.dateFrom && opts.dateTo) {
      conditions.push(
        between(sales.soldAt, new Date(opts.dateFrom), new Date(opts.dateTo)),
      );
    } else if (opts.dateFrom) {
      conditions.push(sql`${sales.soldAt} >= ${new Date(opts.dateFrom)}`);
    } else if (opts.dateTo) {
      conditions.push(sql`${sales.soldAt} <= ${new Date(opts.dateTo)}`);
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select({
          sale: sales,
          clientName: clients.name,
        })
        .from(sales)
        .leftJoin(clients, eq(sales.clientId, clients.id))
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${sales.soldAt} DESC`),
      this.db.select({ value: count() }).from(sales).where(where),
    ]);

    const saleIds = rows.map((r) => r.sale.id);

    const itemsBySale: Record<
      string,
      Array<{
        id: string;
        productId: string;
        quantity: number;
        unitPrice: string;
        subtotal: string;
        productName: string | null;
      }>
    > = {};

    if (saleIds.length > 0) {
      const allItems = await this.db
        .select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          subtotal: saleItems.subtotal,
          productName: products.name,
        })
        .from(saleItems)
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(sql`${saleItems.saleId} IN ${saleIds}`);

      for (const item of allItems) {
        if (!itemsBySale[item.saleId]) {
          itemsBySale[item.saleId] = [];
        }
        itemsBySale[item.saleId]!.push(item);
      }
    }

    const items = rows.map((r) =>
      this.toSaleWithJoins(r.sale, itemsBySale[r.sale.id] ?? [], r.clientName),
    );

    return {
      items,
      total: countResult?.value ?? 0,
    };
  }

  async updateStatus(
    userId: string,
    id: string,
    status: SaleStatus,
  ): Promise<Sale | null> {
    const [row] = await this.db
      .update(sales)
      .set({ status })
      .where(and(eq(sales.userId, userId), eq(sales.id, id)))
      .returning();

    if (!row) return null;

    return this.findById(userId, row.id);
  }

  async countByUserInMonth(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const [result] = await this.db
      .select({ value: count() })
      .from(sales)
      .where(and(eq(sales.userId, userId), between(sales.soldAt, startDate, endDate)));

    return result?.value ?? 0;
  }

  async getDaySummary(userId: string, date: string): Promise<DaySummary> {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const [result] = await this.db
      .select({
        totalSales: count(),
        totalAmount: sum(sales.total),
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          between(sales.soldAt, dayStart, dayEnd),
          sql`${sales.status} != 'cancelled'`,
        ),
      );

    const totalSales = result?.totalSales ?? 0;
    const totalAmount = Number(result?.totalAmount ?? 0);
    const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0;

    return { totalSales, totalAmount, averageTicket };
  }

  private toSale(
    row: typeof sales.$inferSelect,
    itemRows: Array<typeof saleItems.$inferSelect>,
    clientName: string | null,
  ): Sale {
    return {
      id: row.id,
      userId: row.userId,
      clientId: row.clientId,
      clientName,
      status: row.status,
      paymentMethod: row.paymentMethod,
      total: Number(row.total),
      notes: row.notes,
      items: itemRows.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: "Produto",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      soldAt: row.soldAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toSaleWithJoins(
    row: typeof sales.$inferSelect,
    itemRows: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: string;
      subtotal: string;
      productName: string | null;
    }>,
    clientName: string | null,
  ): Sale {
    return {
      id: row.id,
      userId: row.userId,
      clientId: row.clientId,
      clientName,
      status: row.status,
      paymentMethod: row.paymentMethod,
      total: Number(row.total),
      notes: row.notes,
      items: itemRows.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName ?? "Produto removido",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      soldAt: row.soldAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
