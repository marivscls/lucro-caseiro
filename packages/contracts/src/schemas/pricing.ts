import { z } from "zod";

export const CreatePricingDto = z.object({
  productId: z.string().uuid().optional(),
  ingredientCost: z.number().min(0),
  packagingCost: z.number().min(0),
  laborCost: z.number().min(0),
  fixedCostShare: z.number().min(0),
  marginPercent: z.number().min(0).max(1000),
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
  createdAt: z.string().datetime(),
});

export type Pricing = z.infer<typeof PricingDto>;
