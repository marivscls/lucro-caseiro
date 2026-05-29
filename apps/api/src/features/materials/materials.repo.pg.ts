import type { Material } from "@lucro-caseiro/contracts";
import { materials } from "@lucro-caseiro/database/schema";
import { and, asc, count, eq, ilike, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type {
  CreateMaterialData,
  FindAllMaterialsOpts,
  IMaterialsRepo,
  UpdateMaterialData,
} from "./materials.types";

const dec = (v: number | undefined | null): string | null =>
  v != null ? String(v) : null;

export class MaterialsRepoPg implements IMaterialsRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateMaterialData): Promise<Material> {
    const [row] = await this.db
      .insert(materials)
      .values({
        userId,
        name: data.name,
        unit: data.unit,
        stockQuantity: String(data.stockQuantity ?? 0),
        stockAlertThreshold: dec(data.stockAlertThreshold),
        costPerUnit: dec(data.costPerUnit),
        notes: data.notes ?? null,
      })
      .returning();

    return this.toMaterial(row!);
  }

  async findById(userId: string, id: string): Promise<Material | null> {
    const [row] = await this.db
      .select()
      .from(materials)
      .where(and(eq(materials.userId, userId), eq(materials.id, id)));
    return row ? this.toMaterial(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllMaterialsOpts,
  ): Promise<{ items: Material[]; total: number }> {
    const conditions = [eq(materials.userId, userId)];
    if (opts.search) conditions.push(ilike(materials.name, `%${opts.search}%`));
    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(materials)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(asc(materials.name)),
      this.db.select({ value: count() }).from(materials).where(where),
    ]);

    return {
      items: rows.map((r) => this.toMaterial(r)),
      total: countResult?.value ?? 0,
    };
  }

  async findLowStock(userId: string): Promise<Material[]> {
    const rows = await this.db
      .select()
      .from(materials)
      .where(
        and(
          eq(materials.userId, userId),
          sql`${materials.stockAlertThreshold} is not null`,
          sql`${materials.stockQuantity} <= ${materials.stockAlertThreshold}`,
        ),
      )
      .orderBy(asc(materials.stockQuantity));
    return rows.map((r) => this.toMaterial(r));
  }

  async update(
    userId: string,
    id: string,
    data: UpdateMaterialData,
  ): Promise<Material | null> {
    const set: Record<string, unknown> = {};
    if (data.name !== undefined) set.name = data.name;
    if (data.unit !== undefined) set.unit = data.unit;
    if (data.stockQuantity !== undefined) set.stockQuantity = String(data.stockQuantity);
    if (data.stockAlertThreshold !== undefined)
      set.stockAlertThreshold = dec(data.stockAlertThreshold);
    if (data.costPerUnit !== undefined) set.costPerUnit = dec(data.costPerUnit);
    if (data.notes !== undefined) set.notes = data.notes ?? null;

    if (Object.keys(set).length === 0) return this.findById(userId, id);

    const [row] = await this.db
      .update(materials)
      .set(set)
      .where(and(eq(materials.userId, userId), eq(materials.id, id)))
      .returning();
    return row ? this.toMaterial(row) : null;
  }

  async adjustStock(userId: string, id: string, delta: number): Promise<Material | null> {
    const current = await this.findById(userId, id);
    if (!current) return null;
    const next = Math.max(0, current.stockQuantity + delta);
    return this.update(userId, id, { stockQuantity: next });
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(materials)
      .where(and(eq(materials.userId, userId), eq(materials.id, id)))
      .returning({ id: materials.id });
    return !!row;
  }

  private toMaterial(row: typeof materials.$inferSelect): Material {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      unit: row.unit,
      stockQuantity: Number(row.stockQuantity),
      stockAlertThreshold:
        row.stockAlertThreshold != null ? Number(row.stockAlertThreshold) : null,
      costPerUnit: row.costPerUnit != null ? Number(row.costPerUnit) : null,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
