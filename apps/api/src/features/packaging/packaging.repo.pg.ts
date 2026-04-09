import type { Packaging } from "@lucro-caseiro/contracts";
import { packaging, productPackaging } from "@lucro-caseiro/database/schema";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreatePackagingData, FindAllOpts, IPackagingRepo } from "./packaging.types";

export class PackagingRepoPg implements IPackagingRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreatePackagingData): Promise<Packaging> {
    const [row] = await this.db
      .insert(packaging)
      .values({
        userId,
        name: data.name,
        type: data.type,
        unitCost: String(data.unitCost),
        supplier: data.supplier ?? null,
        photoUrl: data.photoUrl ?? null,
      })
      .returning();

    return this.toPackaging(row!);
  }

  async findById(userId: string, id: string): Promise<Packaging | null> {
    const [row] = await this.db
      .select()
      .from(packaging)
      .where(and(eq(packaging.userId, userId), eq(packaging.id, id)));

    return row ? this.toPackaging(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Packaging[]; total: number }> {
    const conditions = [eq(packaging.userId, userId)];

    if (opts.search) {
      conditions.push(ilike(packaging.name, `%${opts.search}%`));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(packaging)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${packaging.createdAt} DESC`),
      this.db.select({ value: count() }).from(packaging).where(where),
    ]);

    return {
      items: rows.map((r) => this.toPackaging(r)),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreatePackagingData>,
  ): Promise<Packaging | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.unitCost !== undefined) updateData.unitCost = String(data.unitCost);
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId, id);
    }

    const [row] = await this.db
      .update(packaging)
      .set(updateData)
      .where(and(eq(packaging.userId, userId), eq(packaging.id, id)))
      .returning();

    return row ? this.toPackaging(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(packaging)
      .where(and(eq(packaging.userId, userId), eq(packaging.id, id)))
      .returning({ id: packaging.id });

    return !!row;
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(packaging)
      .where(eq(packaging.userId, userId));

    return result?.value ?? 0;
  }

  async linkToProduct(packagingId: string, productId: string): Promise<void> {
    await this.db
      .insert(productPackaging)
      .values({ packagingId, productId })
      .onConflictDoNothing();
  }

  async unlinkFromProduct(packagingId: string, productId: string): Promise<boolean> {
    const [row] = await this.db
      .delete(productPackaging)
      .where(
        and(
          eq(productPackaging.packagingId, packagingId),
          eq(productPackaging.productId, productId),
        ),
      )
      .returning({ productId: productPackaging.productId });

    return !!row;
  }

  private toPackaging(row: typeof packaging.$inferSelect): Packaging {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      type: row.type,
      unitCost: Number(row.unitCost),
      supplier: row.supplier,
      photoUrl: row.photoUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
