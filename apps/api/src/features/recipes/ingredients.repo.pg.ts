import type { Ingredient } from "@lucro-caseiro/contracts";
import { ingredients } from "@lucro-caseiro/database/schema";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type {
  CreateIngredientData,
  FindAllOpts,
  IIngredientsRepo,
} from "./ingredients.types";

export class IngredientsRepoPg implements IIngredientsRepo {
  constructor(private db: PostgresJsDatabase) {}

  async create(userId: string, data: CreateIngredientData): Promise<Ingredient> {
    const [row] = await this.db
      .insert(ingredients)
      .values({
        userId,
        name: data.name,
        price: String(data.price),
        quantityPerPackage: String(data.quantityPerPackage),
        unit: data.unit,
        supplier: data.supplier ?? null,
      })
      .returning();

    return this.toIngredient(row!);
  }

  async findById(userId: string, id: string): Promise<Ingredient | null> {
    const [row] = await this.db
      .select()
      .from(ingredients)
      .where(and(eq(ingredients.userId, userId), eq(ingredients.id, id)));

    return row ? this.toIngredient(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Ingredient[]; total: number }> {
    const conditions = [eq(ingredients.userId, userId)];

    if (opts.search) {
      conditions.push(ilike(ingredients.name, `%${opts.search}%`));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(ingredients)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${ingredients.updatedAt} DESC`),
      this.db.select({ value: count() }).from(ingredients).where(where),
    ]);

    return {
      items: rows.map((r) => this.toIngredient(r)),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateIngredientData>,
  ): Promise<Ingredient | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = String(data.price);
    if (data.quantityPerPackage !== undefined)
      updateData.quantityPerPackage = String(data.quantityPerPackage);
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.supplier !== undefined) updateData.supplier = data.supplier;

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId, id);
    }

    updateData.updatedAt = new Date();

    const [row] = await this.db
      .update(ingredients)
      .set(updateData)
      .where(and(eq(ingredients.userId, userId), eq(ingredients.id, id)))
      .returning();

    return row ? this.toIngredient(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(ingredients)
      .where(and(eq(ingredients.userId, userId), eq(ingredients.id, id)))
      .returning({ id: ingredients.id });

    return !!row;
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(ingredients)
      .where(eq(ingredients.userId, userId));

    return result?.value ?? 0;
  }

  private toIngredient(row: typeof ingredients.$inferSelect): Ingredient {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      price: Number(row.price),
      quantityPerPackage: Number(row.quantityPerPackage),
      unit: row.unit,
      supplier: row.supplier,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
