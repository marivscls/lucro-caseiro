import type { Pricing } from "@lucro-caseiro/contracts";

export interface IPricingRepo {
  create(userId: string, data: CreatePricingData): Promise<Pricing>;
  findById(userId: string, id: string): Promise<Pricing | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Pricing[]; total: number }>;
  findByProduct(userId: string, productId: string): Promise<Pricing[]>;
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
}

export interface FindAllOpts {
  page: number;
  limit: number;
  productId?: string;
}
