import { z } from "zod";

import { MAX_MONEY, MAX_QUANTITY } from "./common";

export const StockMovementType = z.enum([
  "sale",
  "purchase",
  "adjustment",
  "cancellation",
  "production",
]);
export type StockMovementType = z.infer<typeof StockMovementType>;

export const CreateStockAdjustmentDto = z.object({
  variationId: z.string().uuid().nullable().optional(),
  delta: z
    .number()
    .int()
    .min(-MAX_QUANTITY)
    .max(MAX_QUANTITY)
    .refine((v) => v !== 0, {
      message: "A quantidade do ajuste deve ser diferente de zero",
    }),
  reason: z.string().max(200).nullable().optional(),
  occurredAt: z.string().datetime().optional(),
});
export type CreateStockAdjustment = z.infer<typeof CreateStockAdjustmentDto>;

export const StockMovementDto = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  variationId: z.string().uuid().nullable(),
  type: StockMovementType,
  delta: z.number(),
  balanceAfter: z.number().nullable(),
  reason: z.string().nullable(),
  sourceId: z.string().uuid().nullable(),
  occurredAt: z.string().datetime(),
});
export type StockMovement = z.infer<typeof StockMovementDto>;

export const CreateServiceDto = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  durationMinutes: z.number().int().min(5).max(1440),
  defaultPrice: z.number().positive().max(MAX_MONEY).nullable().optional(),
  materialCost: z.number().min(0).max(MAX_MONEY).optional(),
  hourlyRate: z.number().min(0).max(MAX_MONEY).optional(),
  otherCost: z.number().min(0).max(MAX_MONEY).optional(),
  fixedCostShare: z.number().min(0).max(MAX_MONEY).optional(),
  markupPercent: z.number().min(0).max(1000).optional(),
  feesPercent: z.number().min(0).max(95).optional(),
  active: z.boolean().optional(),
});
export type CreateService = z.infer<typeof CreateServiceDto>;
export const UpdateServiceDto = CreateServiceDto.partial();
export type UpdateService = z.infer<typeof UpdateServiceDto>;

export const ServiceDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number().int(),
  defaultPrice: z.number().nullable(),
  materialCost: z.number(),
  hourlyRate: z.number(),
  otherCost: z.number(),
  fixedCostShare: z.number(),
  markupPercent: z.number(),
  feesPercent: z.number(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Service = z.infer<typeof ServiceDto>;

export const ProductionRunStatus = z.enum(["draft", "closed"]);
export type ProductionRunStatus = z.infer<typeof ProductionRunStatus>;

export const ProductionRunMaterialInputDto = z.object({
  materialId: z.string().uuid(),
  plannedQuantity: z.number().min(0).max(MAX_QUANTITY),
  actualQuantity: z.number().min(0).max(MAX_QUANTITY),
  wasteQuantity: z.number().min(0).max(MAX_QUANTITY).default(0),
  unitCost: z.number().min(0).max(MAX_MONEY),
});
export type ProductionRunMaterialInput = z.infer<typeof ProductionRunMaterialInputDto>;

export const CreateProductionRunDto = z.object({
  productId: z.string().uuid().nullable().optional(),
  recipeId: z.string().uuid().nullable().optional(),
  plannedQuantity: z.number().positive().max(MAX_QUANTITY),
  producedQuantity: z.number().min(0).max(MAX_QUANTITY),
  notes: z.string().max(500).nullable().optional(),
  materials: z.array(ProductionRunMaterialInputDto).min(1).max(200),
});
export type CreateProductionRun = z.infer<typeof CreateProductionRunDto>;

export const ProductionRunDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  recipeId: z.string().uuid().nullable(),
  plannedQuantity: z.number(),
  producedQuantity: z.number(),
  plannedCost: z.number(),
  actualCost: z.number(),
  wasteCost: z.number(),
  status: ProductionRunStatus,
  notes: z.string().nullable(),
  materials: z.array(
    ProductionRunMaterialInputDto.extend({
      id: z.string().uuid(),
      materialName: z.string(),
    }),
  ),
  createdAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
});
export type ProductionRun = z.infer<typeof ProductionRunDto>;
