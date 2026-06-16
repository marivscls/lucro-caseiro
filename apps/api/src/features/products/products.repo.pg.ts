import type { Product, ProductComponent } from "@lucro-caseiro/contracts";
import { productComponents, products } from "@lucro-caseiro/database/schema";
import { and, avg, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { calculateCompositeCost } from "./products.domain";
import type { AppDatabase } from "../../shared/db";
import type {
  ComponentCandidate,
  CreateProductData,
  FindAllOpts,
  IProductsRepo,
} from "./products.types";

/** Linha de componente resolvida com nome e custo do produto-filho. */
type ComponentRow = {
  componentProductId: string;
  name: string;
  costPrice: string | null;
  quantity: string;
};

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
        code: data.code ?? null,
        salePrice: String(data.salePrice),
        saleUnit: data.saleUnit ?? "unit",
        costPrice: data.costPrice != null ? String(data.costPrice) : null,
        recipeId: data.recipeId ?? null,
        stockQuantity: data.stockQuantity ?? null,
        stockAlertThreshold: data.stockAlertThreshold ?? null,
        isComposite: data.isComposite ?? false,
      })
      .returning();

    const created = row!;

    if (data.isComposite && data.components && data.components.length > 0) {
      await this.insertComponents(created.id, data.components);
    }

    // Releitura para computar o custo do kit a partir dos componentes.
    return (await this.findById(userId, created.id)) ?? this.toProduct(created, []);
  }

  async findById(userId: string, id: string): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.id, id)));

    if (!row) return null;

    const componentRows = row.isComposite ? await this.fetchComponents(id) : [];
    return this.toProduct(row, componentRows);
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
      const term = `%${opts.search}%`;
      conditions.push(or(ilike(products.name, term), ilike(products.code, term))!);
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

    const items = await Promise.all(
      rows.map(async (r) => {
        const componentRows = r.isComposite ? await this.fetchComponents(r.id) : [];
        return this.toProduct(r, componentRows);
      }),
    );

    return {
      items,
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
    if (data.code !== undefined) updateData.code = data.code;
    if (data.salePrice !== undefined) updateData.salePrice = String(data.salePrice);
    if (data.saleUnit !== undefined) updateData.saleUnit = data.saleUnit;
    if (data.costPrice !== undefined)
      updateData.costPrice = data.costPrice != null ? String(data.costPrice) : null;
    if (data.recipeId !== undefined) updateData.recipeId = data.recipeId;
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
    if (data.stockAlertThreshold !== undefined)
      updateData.stockAlertThreshold = data.stockAlertThreshold;
    if (data.isComposite !== undefined) updateData.isComposite = data.isComposite;

    if (Object.keys(updateData).length > 0) {
      const [row] = await this.db
        .update(products)
        .set(updateData)
        .where(and(eq(products.userId, userId), eq(products.id, id)))
        .returning({ id: products.id });

      if (!row) return null;
    }

    // Estrategia de replace (igual recipe_ingredients): quando `components` vem
    // definido, apaga os antigos e regrava os novos.
    if (data.components !== undefined) {
      await this.db.delete(productComponents).where(eq(productComponents.productId, id));

      if (data.components.length > 0) {
        await this.insertComponents(id, data.components);
      }
    }

    return this.findById(userId, id);
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

  async averageActivePrice(userId: string): Promise<number | null> {
    const [result] = await this.db
      .select({ value: avg(products.salePrice) })
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.isActive, true)));

    return result?.value != null ? Number(result.value) : null;
  }

  async findComponentCandidates(
    userId: string,
    ids: string[],
  ): Promise<ComponentCandidate[]> {
    if (ids.length === 0) return [];

    const rows = await this.db
      .select({ id: products.id, isComposite: products.isComposite })
      .from(products)
      .where(
        and(
          eq(products.userId, userId),
          eq(products.isActive, true),
          inArray(products.id, ids),
        ),
      );

    return rows.map((r) => ({ id: r.id, isComposite: r.isComposite }));
  }

  /** Insere os componentes de um kit. */
  private async insertComponents(
    productId: string,
    components: { componentProductId: string; quantity: number }[],
  ): Promise<void> {
    await this.db.insert(productComponents).values(
      components.map((c) => ({
        productId,
        componentProductId: c.componentProductId,
        quantity: String(c.quantity),
      })),
    );
  }

  /** Busca os componentes de um kit com nome e custo do produto-filho. */
  private async fetchComponents(productId: string): Promise<ComponentRow[]> {
    return this.db
      .select({
        componentProductId: productComponents.componentProductId,
        name: products.name,
        costPrice: products.costPrice,
        quantity: productComponents.quantity,
      })
      .from(productComponents)
      .innerJoin(products, eq(productComponents.componentProductId, products.id))
      .where(eq(productComponents.productId, productId));
  }

  private toProduct(
    row: typeof products.$inferSelect,
    componentRows: ComponentRow[],
  ): Product {
    const components: ProductComponent[] = componentRows.map((c) => ({
      componentProductId: c.componentProductId,
      name: c.name,
      costPrice: c.costPrice != null ? Number(c.costPrice) : null,
      quantity: Number(c.quantity),
    }));

    // Produto composto: custo = soma de (custo do componente x quantidade).
    // Caso contrario, usa o costPrice armazenado.
    const storedCost = row.costPrice ? Number(row.costPrice) : null;
    const costPrice = row.isComposite ? calculateCompositeCost(components) : storedCost;

    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      category: row.category,
      photoUrl: row.photoUrl,
      code: row.code,
      salePrice: Number(row.salePrice),
      saleUnit: row.saleUnit === "kg" ? "kg" : "unit",
      costPrice,
      recipeId: row.recipeId,
      stockQuantity: row.stockQuantity,
      stockAlertThreshold: row.stockAlertThreshold,
      isComposite: row.isComposite,
      ...(row.isComposite ? { components } : {}),
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
