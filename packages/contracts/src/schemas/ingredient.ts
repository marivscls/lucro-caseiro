import { z } from "zod";

export const CreateIngredientDto = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  quantityPerPackage: z.number().positive(),
  unit: z.string().min(1).max(20),
  supplier: z.string().max(200).optional(),
});

export type CreateIngredient = z.infer<typeof CreateIngredientDto>;

export const UpdateIngredientDto = CreateIngredientDto.partial();
export type UpdateIngredient = z.infer<typeof UpdateIngredientDto>;

export const IngredientDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  quantityPerPackage: z.number(),
  unit: z.string(),
  supplier: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export type Ingredient = z.infer<typeof IngredientDto>;
