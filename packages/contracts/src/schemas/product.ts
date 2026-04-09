import { z } from "zod";

export const CreateProductDto = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  photoUrl: z.string().url().optional(),
  salePrice: z.number().positive(),
  recipeId: z.string().uuid().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  stockAlertThreshold: z.number().int().min(0).optional(),
});

export type CreateProduct = z.infer<typeof CreateProductDto>;

export const UpdateProductDto = CreateProductDto.partial();
export type UpdateProduct = z.infer<typeof UpdateProductDto>;

export const ProductDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  photoUrl: z.string().nullable(),
  salePrice: z.number(),
  costPrice: z.number().nullable(),
  recipeId: z.string().uuid().nullable(),
  stockQuantity: z.number().int().nullable(),
  stockAlertThreshold: z.number().int().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductDto>;
