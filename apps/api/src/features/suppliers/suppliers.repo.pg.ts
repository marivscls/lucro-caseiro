import type { Supplier } from "@lucro-caseiro/contracts";
import { suppliers } from "@lucro-caseiro/database/schema";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreateSupplierData, FindAllOpts, ISuppliersRepo } from "./suppliers.types";

export class SuppliersRepoPg implements ISuppliersRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateSupplierData): Promise<Supplier> {
    const [row] = await this.db
      .insert(suppliers)
      .values({
        userId,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
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

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Supplier[]; total: number }> {
    const conditions = [eq(suppliers.userId, userId)];

    if (opts.search) {
      conditions.push(
        or(
          ilike(suppliers.name, `%${opts.search}%`),
          ilike(suppliers.phone, `%${opts.search}%`),
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

  async update(
    userId: string,
    id: string,
    data: Partial<CreateSupplierData>,
  ): Promise<Supplier | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.notes !== undefined) updateData.notes = data.notes;

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
      .where(eq(suppliers.userId, userId));

    return result?.value ?? 0;
  }

  private toSupplier(row: typeof suppliers.$inferSelect): Supplier {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
