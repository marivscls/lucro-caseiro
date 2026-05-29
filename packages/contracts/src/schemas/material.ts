import { z } from "zod";

export const CreateMaterialDto = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(20),
  stockQuantity: z.number().min(0).optional(),
  stockAlertThreshold: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateMaterial = z.infer<typeof CreateMaterialDto>;

export const UpdateMaterialDto = CreateMaterialDto.partial();
export type UpdateMaterial = z.infer<typeof UpdateMaterialDto>;

export const AdjustMaterialDto = z.object({
  delta: z.number(),
});

export type AdjustMaterial = z.infer<typeof AdjustMaterialDto>;

export const MaterialDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  unit: z.string(),
  stockQuantity: z.number(),
  stockAlertThreshold: z.number().nullable(),
  costPerUnit: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Material = z.infer<typeof MaterialDto>;
