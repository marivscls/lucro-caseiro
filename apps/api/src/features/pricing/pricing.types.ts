import type {
  Pricing,
  PricingAllocationMode,
  PricingPreferences,
  UpsertPricingPreferences,
} from "@lucro-caseiro/contracts";

export interface IPricingRepo {
  create(userId: string, data: CreatePricingData): Promise<Pricing>;
  findById(userId: string, id: string): Promise<Pricing | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Pricing[]; total: number }>;
  findByProduct(userId: string, productId: string): Promise<Pricing[]>;
  getPreferences(userId: string): Promise<PricingPreferences | null>;
  upsertPreferences(
    userId: string,
    data: UpsertPricingPreferences,
  ): Promise<PricingPreferences>;
}

export interface CreatePricingData {
  productId?: string;
  ingredientCost: number;
  packagingCost: number;
  laborCost: number;
  fixedCostShare: number;
  totalCost: number;
  marginPercent: number;
  suggestedPrice: number;
  feesPercent: number;
  feesAmount: number;
  finalPrice: number;
  allocationMode: PricingAllocationMode;
  monthlyFixedCosts?: number;
  revenueBasis?: number;
  overheadPercent: number;
  channelName?: string;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  productId?: string;
}
