import type { Recipe } from "@lucro-caseiro/contracts";
import { ingredients } from "@lucro-caseiro/database/schema";
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
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        photoUrl: data.photoUrl ?? null,
        totalCost: "0",
        costPerUnit: "0",
      })
      .returning();

    const recipe = recipeRow!;

    if (data.ingredients.length > 0) {
      await this.db.insert(recipeIngredients).values(
        data.ingredients.map((ing) => ({
          recipeId: recipe.id,
          ingredientId: ing.ingredientId,
          quantity: String(ing.quantity),
          unit: ing.unit,
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

    const ingredientRows = await this.db
      .select({
        ingredientId: recipeIngredients.ingredientId,
        quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
        ingredientName: ingredients.name,
        ingredientPrice: ingredients.price,
        quantityPerPackage: ingredients.quantityPerPackage,
      })
      .from(recipeIngredients)
      .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
      .where(eq(recipeIngredients.recipeId, id));

    return this.toRecipe(recipeRow, ingredientRows);
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
        const ingredientRows = await this.db
          .select({
            ingredientId: recipeIngredients.ingredientId,
            quantity: recipeIngredients.quantity,
            unit: recipeIngredients.unit,
            ingredientName: ingredients.name,
            ingredientPrice: ingredients.price,
            quantityPerPackage: ingredients.quantityPerPackage,
          })
          .from(recipeIngredients)
          .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
          .where(eq(recipeIngredients.recipeId, row.id));

        return this.toRecipe(row, ingredientRows);
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
    if (data.yieldQuantity !== undefined) updateData.yieldQuantity = data.yieldQuantity;
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
          data.ingredients.map((ing) => ({
            recipeId: id,
            ingredientId: ing.ingredientId,
            quantity: String(ing.quantity),
            unit: ing.unit,
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
    ingredientRows: {
      ingredientId: string;
      quantity: string;
      unit: string;
      ingredientName: string;
      ingredientPrice: string;
      quantityPerPackage: string;
    }[],
  ): Recipe {
    const recipeIngredientsList = ingredientRows.map((ing) => {
      const price = Number(ing.ingredientPrice);
      const qty = Number(ing.quantity);
      const qtyPerPkg = Number(ing.quantityPerPackage);
      const cost = (price / qtyPerPkg) * qty;

      return {
        ingredientId: ing.ingredientId,
        quantity: qty,
        unit: ing.unit,
        ingredientName: ing.ingredientName,
        ingredientPrice: price,
        cost,
      };
    });

    const totalCost = recipeIngredientsList.reduce((sum, ing) => sum + ing.cost, 0);
    const costPerUnit = row.yieldQuantity > 0 ? totalCost / row.yieldQuantity : 0;

    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      category: row.category,
      instructions: row.instructions,
      yieldQuantity: row.yieldQuantity,
      yieldUnit: row.yieldUnit,
      photoUrl: row.photoUrl,
      totalCost,
      costPerUnit,
      ingredients: recipeIngredientsList,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
