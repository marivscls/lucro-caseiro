import { z } from "zod";
import { MAX_MONEY, MAX_QUANTITY } from "./common";

export const CreateMaterialDto = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(20),
  stockQuantity: z.number().min(0).max(MAX_QUANTITY).optional(),
  stockAlertThreshold: z.number().min(0).max(MAX_QUANTITY).optional(),
  costPerUnit: z.number().min(0).max(MAX_MONEY).optional(),
  // #14: conteúdo por unidade (ex.: 1 lata = 350 ml). Opcional; se um vier, ambos devem vir.
  contentPerUnit: z.number().positive().max(MAX_QUANTITY).nullable().optional(),
  contentUnit: z.string().min(1).max(20).nullable().optional(),
  notes: z.string().max(500).optional(),
  // Ícone (emoji) escolhido pelo usuário. Nullable: sem ele, o avatar é
  // resolvido automaticamente pelo nome.
  icon: z.string().max(32).nullable().optional(),
  // Fornecedor de quem o insumo é comprado (opcional). FK -> suppliers.
  supplierId: z.string().uuid().nullable().optional(),
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
  contentPerUnit: z.number().nullable(),
  contentUnit: z.string().nullable(),
  notes: z.string().nullable(),
  icon: z.string().nullable(),
  supplierId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Material = z.infer<typeof MaterialDto>;
