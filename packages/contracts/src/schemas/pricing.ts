import { z } from "zod";
import { MAX_MONEY } from "./common";

export const PricingAllocationModeDto = z.enum(["unit", "revenue"]);
export type PricingAllocationMode = z.infer<typeof PricingAllocationModeDto>;

export const PricingChannelFeeDto = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(60),
  percent: z.number().min(0).max(95),
});
export type PricingChannelFee = z.infer<typeof PricingChannelFeeDto>;

export const UpsertPricingPreferencesDto = z.object({
  channelFees: z.array(PricingChannelFeeDto).max(8),
});
export type UpsertPricingPreferences = z.infer<typeof UpsertPricingPreferencesDto>;

export const PricingPreferencesDto = UpsertPricingPreferencesDto.extend({
  userId: z.string().uuid(),
  updatedAt: z.string().datetime(),
});
export type PricingPreferences = z.infer<typeof PricingPreferencesDto>;

export const CreatePricingDto = z
  .object({
    productId: z.string().uuid().optional(),
    ingredientCost: z.number().min(0).max(MAX_MONEY),
    packagingCost: z.number().min(0).max(MAX_MONEY),
    laborCost: z.number().min(0).max(MAX_MONEY),
    fixedCostShare: z.number().min(0).max(MAX_MONEY),
    marginPercent: z.number().min(0).max(1000),
    // Taxa do único canal selecionado para este cálculo. Max < 100.
    feesPercent: z.number().min(0).max(95).optional(),
    allocationMode: PricingAllocationModeDto.optional(),
    monthlyFixedCosts: z.number().min(0).max(MAX_MONEY).optional(),
    revenueBasis: z.number().positive().max(MAX_MONEY).optional(),
    channelName: z.string().trim().min(1).max(60).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.allocationMode !== "revenue") return;
    if (!(data.monthlyFixedCosts && data.monthlyFixedCosts > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthlyFixedCosts"],
        message: "Informe os custos mensais confirmados",
      });
    }
    if (!(data.revenueBasis && data.revenueBasis > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["revenueBasis"],
        message: "Informe a base de faturamento confirmada",
      });
    }
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
  allocationMode: PricingAllocationModeDto,
  monthlyFixedCosts: z.number().nullable(),
  revenueBasis: z.number().nullable(),
  overheadPercent: z.number(),
  channelName: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Pricing = z.infer<typeof PricingDto>;
