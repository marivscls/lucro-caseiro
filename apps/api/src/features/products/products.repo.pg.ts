import type { Product } from "@lucro-caseiro/contracts";
import { products } from "@lucro-caseiro/database/schema";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreateProductData, FindAllOpts, IProductsRepo } from "./products.types";

export class ProductsRepoPg implements IProductsRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateProductData): Promise<Product> {
    const [row] = await this.db
      .insert(products)
      .values({
        userId,
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        photoUrl: data.photoUrl ?? null,
        salePrice: String(data.salePrice),
        recipeId: data.recipeId ?? null,
        stockQuantity: data.stockQuantity ?? null,
        stockAlertThreshold: data.stockAlertThreshold ?? null,
      })
      .returning();

    return this.toProduct(row!);
  }

  async findById(userId: string, id: string): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.id, id)));

    return row ? this.toProduct(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Product[]; total: number }> {
    const conditions = [eq(products.userId, userId)];

    if (opts.activeOnly !== false) {
      conditions.push(eq(products.isActive, true));
    }

    if (opts.category) {
      conditions.push(eq(products.category, opts.category));
    }

    if (opts.search) {
      conditions.push(ilike(products.name, `%${opts.search}%`));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${products.createdAt} DESC`),
      this.db.select({ value: count() }).from(products).where(where),
    ]);

    return {
      items: rows.map((r) => this.toProduct(r)),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateProductData>,
  ): Promise<Product | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.salePrice !== undefined) updateData.salePrice = String(data.salePrice);
    if (data.recipeId !== undefined) updateData.recipeId = data.recipeId;
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
    if (data.stockAlertThreshold !== undefined)
      updateData.stockAlertThreshold = data.stockAlertThreshold;

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId, id);
    }

    const [row] = await this.db
      .update(products)
      .set(updateData)
      .where(and(eq(products.userId, userId), eq(products.id, id)))
      .returning();

    return row ? this.toProduct(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .update(products)
      .set({ isActive: false })
      .where(and(eq(products.userId, userId), eq(products.id, id)))
      .returning({ id: products.id });

    return !!row;
  }

  async decrementStock(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    await this.db
      .update(products)
      .set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` })
      .where(and(eq(products.userId, userId), eq(products.id, productId)));
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.isActive, true)));

    return result?.value ?? 0;
  }

  private toProduct(row: typeof products.$inferSelect): Product {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      category: row.category,
      photoUrl: row.photoUrl,
      salePrice: Number(row.salePrice),
      costPrice: row.costPrice ? Number(row.costPrice) : null,
      recipeId: row.recipeId,
      stockQuantity: row.stockQuantity,
      stockAlertThreshold: row.stockAlertThreshold,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
