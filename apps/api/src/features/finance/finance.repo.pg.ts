import type { FinanceEntry, FinanceSummary } from "@lucro-caseiro/contracts";
import { financeEntries } from "@lucro-caseiro/database/schema";
import { and, count, eq, gte, lte, sql, sum } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreateFinanceEntryData, FindAllOpts, IFinanceRepo } from "./finance.types";

export class FinanceRepoPg implements IFinanceRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateFinanceEntryData): Promise<FinanceEntry> {
    const [row] = await this.db
      .insert(financeEntries)
      .values({
        userId,
        type: data.type,
        category: data.category,
        amount: String(data.amount),
        description: data.description,
        date: data.date,
        saleId: data.saleId ?? null,
      })
      .returning();

    return this.toFinanceEntry(row!);
  }

  async findById(userId: string, id: string): Promise<FinanceEntry | null> {
    const [row] = await this.db
      .select()
      .from(financeEntries)
      .where(and(eq(financeEntries.userId, userId), eq(financeEntries.id, id)));

    return row ? this.toFinanceEntry(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: FinanceEntry[]; total: number }> {
    const conditions = [eq(financeEntries.userId, userId)];

    if (opts.type) {
      conditions.push(eq(financeEntries.type, opts.type));
    }

    if (opts.category) {
      conditions.push(eq(financeEntries.category, opts.category));
    }

    if (opts.startDate) {
      conditions.push(gte(financeEntries.date, opts.startDate));
    }

    if (opts.endDate) {
      conditions.push(lte(financeEntries.date, opts.endDate));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(financeEntries)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${financeEntries.date} DESC`),
      this.db.select({ value: count() }).from(financeEntries).where(where),
    ]);

    return {
      items: rows.map((r) => this.toFinanceEntry(r)),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateFinanceEntryData>,
  ): Promise<FinanceEntry | null> {
    const updateData: Record<string, unknown> = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = String(data.amount);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.saleId !== undefined) updateData.saleId = data.saleId;

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId, id);
    }

    const [row] = await this.db
      .update(financeEntries)
      .set(updateData)
      .where(and(eq(financeEntries.userId, userId), eq(financeEntries.id, id)))
      .returning();

    return row ? this.toFinanceEntry(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(financeEntries)
      .where(and(eq(financeEntries.userId, userId), eq(financeEntries.id, id)))
      .returning({ id: financeEntries.id });

    return !!row;
  }

  async getSummary(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Omit<FinanceSummary, "period">> {
    const baseConditions = [
      eq(financeEntries.userId, userId),
      gte(financeEntries.date, startDate),
      lte(financeEntries.date, endDate),
    ];

    const [incomeResult, expenseResult] = await Promise.all([
      this.db
        .select({ total: sum(financeEntries.amount) })
        .from(financeEntries)
        .where(and(...baseConditions, eq(financeEntries.type, "income"))),
      this.db
        .select({ total: sum(financeEntries.amount) })
        .from(financeEntries)
        .where(and(...baseConditions, eq(financeEntries.type, "expense"))),
    ]);

    const totalIncome = Number(incomeResult[0]?.total ?? 0);
    const totalExpenses = Number(expenseResult[0]?.total ?? 0);

    return {
      totalIncome,
      totalExpenses,
      profit: totalIncome - totalExpenses,
    };
  }

  private toFinanceEntry(row: typeof financeEntries.$inferSelect): FinanceEntry {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      category: row.category,
      amount: Number(row.amount),
      description: row.description,
      date: row.date,
      saleId: row.saleId ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
