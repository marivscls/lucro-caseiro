import type {
  CreateProductionRun,
  ProductionRun,
} from "@lucro-caseiro/contracts";
import {
  materials,
  productionRunItems,
  productionRuns,
  products,
} from "@lucro-caseiro/database/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";

export class ProductionRepoPg {
  constructor(private db: AppDatabase) {}

  async create(
    userId: string,
    data: CreateProductionRun,
    costs: { plannedCost: number; actualCost: number; wasteCost: number },
  ): Promise<ProductionRun> {
    return this.db.transaction(async (tx) => {
      const materialIds = data.materials.map((item) => item.materialId);
      const owned = await tx
        .select({ id: materials.id, name: materials.name, stock: materials.stockQuantity })
        .from(materials)
        .where(
          and(
            eq(materials.userId, userId),
            inArray(materials.id, materialIds),
          ),
        );
      if (owned.length !== new Set(materialIds).size) {
        throw new Error("Um dos insumos não foi encontrado");
      }

      const [run] = await tx
        .insert(productionRuns)
        .values({
          userId,
          productId: data.productId ?? null,
          recipeId: data.recipeId ?? null,
          plannedQuantity: String(data.plannedQuantity),
          producedQuantity: String(data.producedQuantity),
          plannedCost: String(costs.plannedCost),
          actualCost: String(costs.actualCost),
          wasteCost: String(costs.wasteCost),
          status: "closed",
          notes: data.notes ?? null,
          closedAt: new Date(),
        })
        .returning();

      const itemRows = await tx
        .insert(productionRunItems)
        .values(
          data.materials.map((item) => ({
            productionRunId: run!.id,
            materialId: item.materialId,
            plannedQuantity: String(item.plannedQuantity),
            actualQuantity: String(item.actualQuantity),
            wasteQuantity: String(item.wasteQuantity),
            unitCost: String(item.unitCost),
          })),
        )
        .returning();

      for (const item of data.materials) {
        const consumed = item.actualQuantity + item.wasteQuantity;
        const row = owned.find((candidate) => candidate.id === item.materialId)!;
        if (Number(row.stock) < consumed) {
          throw new Error(`Estoque insuficiente para ${row.name}`);
        }
        await tx
          .update(materials)
          .set({
            stockQuantity: sql`${materials.stockQuantity} - ${consumed}`,
          })
          .where(
            and(eq(materials.userId, userId), eq(materials.id, item.materialId)),
          );
      }

      if (data.productId && data.producedQuantity > 0) {
        if (!Number.isInteger(data.producedQuantity)) {
          throw new Error("A quantidade produzida do produto deve ser inteira");
        }
        await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} + ${data.producedQuantity}`,
          })
          .where(
            and(
              eq(products.userId, userId),
              eq(products.id, data.productId),
              sql`${products.stockQuantity} IS NOT NULL`,
            ),
          );
      }

      return this.toRun(run!, itemRows, owned);
    });
  }

  async list(userId: string, limit: number): Promise<ProductionRun[]> {
    const rows = await this.db
      .select()
      .from(productionRuns)
      .where(eq(productionRuns.userId, userId))
      .orderBy(desc(productionRuns.createdAt))
      .limit(limit);
    const result: ProductionRun[] = [];
    for (const row of rows) {
      const itemRows = await this.db
        .select()
        .from(productionRunItems)
        .where(eq(productionRunItems.productionRunId, row.id));
      const materialRows = itemRows.length
        ? await this.db
            .select({ id: materials.id, name: materials.name })
            .from(materials)
            .where(
              inArray(
                materials.id,
                itemRows.map((item) => item.materialId),
              ),
            )
        : [];
      result.push(this.toRun(row, itemRows, materialRows));
    }
    return result;
  }

  private toRun(
    row: typeof productionRuns.$inferSelect,
    itemRows: Array<typeof productionRunItems.$inferSelect>,
    materialRows: Array<{ id: string; name: string }>,
  ): ProductionRun {
    return {
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      recipeId: row.recipeId,
      plannedQuantity: Number(row.plannedQuantity),
      producedQuantity: Number(row.producedQuantity),
      plannedCost: Number(row.plannedCost),
      actualCost: Number(row.actualCost),
      wasteCost: Number(row.wasteCost),
      status: row.status as ProductionRun["status"],
      notes: row.notes,
      materials: itemRows.map((item) => ({
        id: item.id,
        materialId: item.materialId,
        materialName:
          materialRows.find((material) => material.id === item.materialId)?.name ??
          "Insumo removido",
        plannedQuantity: Number(item.plannedQuantity),
        actualQuantity: Number(item.actualQuantity),
        wasteQuantity: Number(item.wasteQuantity),
        unitCost: Number(item.unitCost),
      })),
      createdAt: row.createdAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
    };
  }
}
