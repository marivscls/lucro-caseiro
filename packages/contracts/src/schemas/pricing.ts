import { z } from "zod";
import { MAX_MONEY, MAX_QUANTITY } from "./common";

export const CreatePricingDto = z.object({
  productId: z.string().uuid().optional(),
  ingredientCost: z.number().min(0).max(MAX_MONEY),
  packagingCost: z.number().min(0).max(MAX_MONEY),
  laborCost: z.number().min(0).max(MAX_MONEY),
  fixedCostShare: z.number().min(0).max(MAX_MONEY),
  marginPercent: z.number().min(0).max(1000),
  // Soma das taxas percentuais sobre a venda (iFood + cartão + ...). Max < 100.
  feesPercent: z.number().min(0).max(95).optional(),
});

export type CreatePricing = z.infer<typeof CreatePricingDto>;

export const PricingDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  ingredientCost: z.number(),
  packagingCost: z.number(),
  laborCost: z.number(),
  fixedCostShare: z.number(),
  totalCost: z.number(),
  marginPercent: z.number(),
  suggestedPrice: z.number(),
  feesPercent: z.number(),
  feesAmount: z.number(),
  finalPrice: z.number(),
  createdAt: z.string().datetime(),
});

export type Pricing = z.infer<typeof PricingDto>;
