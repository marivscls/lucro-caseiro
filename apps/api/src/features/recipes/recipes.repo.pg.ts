import type { Recipe } from "@lucro-caseiro/contracts";
import { materials } from "@lucro-caseiro/database/schema";
import { recipeIngredients, recipes } from "@lucro-caseiro/database/schema";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreateRecipeData, FindAllOpts, IRecipesRepo } from "./recipes.types";

export class RecipesRepoPg implements IRecipesRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateRecipeData): Promise<Recipe> {
    const [recipeRow] = await this.db
      .insert(recipes)
      .values({
        userId,
        name: data.name,
        category: data.category,
        instructions: data.instructions ?? null,
        yieldQuantity: String(data.yieldQuantity),
        yieldUnit: data.yieldUnit,
        photoUrl: data.photoUrl ?? null,
        totalCost: "0",
        costPerUnit: "0",
      })
      .returning();

    const recipe = recipeRow!;

    if (data.ingredients.length > 0) {
      await this.db.insert(recipeIngredients).values(
        data.ingredients.map((line) => ({
          recipeId: recipe.id,
          materialId: line.materialId,
          quantity: String(line.quantity),
          unit: line.unit,
        })),
      );
    }

    return this.findById(userId, recipe.id) as Promise<Recipe>;
  }

  async findById(userId: string, id: string): Promise<Recipe | null> {
    const [recipeRow] = await this.db
      .select()
      .from(recipes)
      .where(and(eq(recipes.userId, userId), eq(recipes.id, id)));

    if (!recipeRow) return null;

    const lineRows = await this.db
      .select({
        materialId: recipeIngredients.materialId,
        quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
        materialName: materials.name,
        materialCostPerUnit: materials.costPerUnit,
      })
      .from(recipeIngredients)
      .innerJoin(materials, eq(recipeIngredients.materialId, materials.id))
      .where(eq(recipeIngredients.recipeId, id));

    return this.toRecipe(recipeRow, lineRows);
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Recipe[]; total: number }> {
    const conditions = [eq(recipes.userId, userId)];

    if (opts.category) {
      conditions.push(eq(recipes.category, opts.category));
    }

    if (opts.search) {
      conditions.push(ilike(recipes.name, `%${opts.search}%`));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(recipes)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${recipes.createdAt} DESC`),
      this.db.select({ value: count() }).from(recipes).where(where),
    ]);

    const items = await Promise.all(
      rows.map(async (row) => {
        const lineRows = await this.db
          .select({
            materialId: recipeIngredients.materialId,
            quantity: recipeIngredients.quantity,
            unit: recipeIngredients.unit,
            materialName: materials.name,
            materialCostPerUnit: materials.costPerUnit,
          })
          .from(recipeIngredients)
          .innerJoin(materials, eq(recipeIngredients.materialId, materials.id))
          .where(eq(recipeIngredients.recipeId, row.id));

        return this.toRecipe(row, lineRows);
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
    data: Partial<CreateRecipeData>,
  ): Promise<Recipe | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.instructions !== undefined) updateData.instructions = data.instructions;
    if (data.yieldQuantity !== undefined)
      updateData.yieldQuantity = String(data.yieldQuantity);
    if (data.yieldUnit !== undefined) updateData.yieldUnit = data.yieldUnit;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(recipes)
        .set(updateData)
        .where(and(eq(recipes.userId, userId), eq(recipes.id, id)));
    }

    if (data.ingredients !== undefined) {
      await this.db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));

      if (data.ingredients.length > 0) {
        await this.db.insert(recipeIngredients).values(
          data.ingredients.map((line) => ({
            recipeId: id,
            materialId: line.materialId,
            quantity: String(line.quantity),
            unit: line.unit,
          })),
        );
      }
    }

    return this.findById(userId, id);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(recipes)
      .where(and(eq(recipes.userId, userId), eq(recipes.id, id)))
      .returning({ id: recipes.id });

    return !!row;
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(recipes)
      .where(eq(recipes.userId, userId));

    return result?.value ?? 0;
  }

  async updateCosts(id: string, totalCost: number, costPerUnit: number): Promise<void> {
    await this.db
      .update(recipes)
      .set({
        totalCost: String(totalCost),
        costPerUnit: String(costPerUnit),
      })
      .where(eq(recipes.id, id));
  }

  private toRecipe(
    row: typeof recipes.$inferSelect,
    lineRows: {
      materialId: string;
      quantity: string;
      unit: string;
      materialName: string;
      materialCostPerUnit: string | null;
    }[],
  ): Recipe {
    const recipeIngredientsList = lineRows.map((line) => {
      const costPerUnit = Number(line.materialCostPerUnit ?? 0);
      const qty = Number(line.quantity);
      const cost = costPerUnit * qty;

      return {
        materialId: line.materialId,
        quantity: qty,
        unit: line.unit,
        materialName: line.materialName,
        materialCostPerUnit: costPerUnit,
        cost,
      };
    });

    const yieldQuantity = Number(row.yieldQuantity);
    const totalCost = recipeIngredientsList.reduce((sum, line) => sum + line.cost, 0);
    const costPerUnit = yieldQuantity > 0 ? totalCost / yieldQuantity : 0;

    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      category: row.category,
      instructions: row.instructions,
      yieldQuantity,
      yieldUnit: row.yieldUnit,
      photoUrl: row.photoUrl,
      totalCost,
      costPerUnit,
      ingredients: recipeIngredientsList,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
