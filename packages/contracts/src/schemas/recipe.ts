import { z } from "zod";
import { MAX_MONEY, MAX_QUANTITY } from "./common";

export const RecipeIngredientDto = z.object({
  materialId: z.string().uuid(),
  quantity: z.number().positive().max(MAX_QUANTITY),
  unit: z.string().min(1).max(20),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientDto>;

export const CreateRecipeDto = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  instructions: z.string().max(5000).optional(),
  yieldQuantity: z.number().positive().max(MAX_QUANTITY),
  yieldUnit: z.string().min(1).max(50),
  photoUrl: z.string().url().optional(),
  ingredients: z.array(RecipeIngredientDto).min(1),
});

export type CreateRecipe = z.infer<typeof CreateRecipeDto>;

export const UpdateRecipeDto = CreateRecipeDto.partial();
export type UpdateRecipe = z.infer<typeof UpdateRecipeDto>;

export const RecipeDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  instructions: z.string().nullable(),
  yieldQuantity: z.number(),
  yieldUnit: z.string(),
  photoUrl: z.string().nullable(),
  totalCost: z.number(),
  costPerUnit: z.number(),
  ingredients: z.array(
    RecipeIngredientDto.extend({
      materialName: z.string(),
      materialCostPerUnit: z.number(),
      cost: z.number(),
    }),
  ),
  createdAt: z.string().datetime(),
});

export type Recipe = z.infer<typeof RecipeDto>;
