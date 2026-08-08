import type {
  Pricing,
  PricingPreferences,
  UpsertPricingPreferences,
} from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import {
  calculatePriceWithFees,
  calculateOverheadPercent,
  calculateRevenueCosting,
  calculateSuggestedPrice,
  calculateTotalCost,
  validatePricingData,
} from "./pricing.domain";
import type { FindAllOpts, IPricingRepo } from "./pricing.types";

interface CalculateInput {
  productId?: string;
  ingredientCost: number;
  packagingCost: number;
  laborCost: number;
  fixedCostShare: number;
  marginPercent: number;
  feesPercent?: number;
  allocationMode?: "unit" | "revenue";
  monthlyFixedCosts?: number;
  revenueBasis?: number;
  channelName?: string;
}

export class PricingUseCases {
  constructor(private repo: IPricingRepo) {}

  async calculate(userId: string, input: CalculateInput): Promise<Pricing> {
    const errors = validatePricingData(input);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const allocationMode = input.allocationMode ?? "unit";
    const directCost = calculateTotalCost(
      input.ingredientCost,
      input.packagingCost,
      input.laborCost,
      0,
    );
    let fixedCostShare = input.fixedCostShare;
    let totalCost: number;
    let suggestedPrice: number;
    let costingPercent = 0;

    if (allocationMode === "revenue") {
      costingPercent = calculateOverheadPercent(
        input.monthlyFixedCosts ?? 0,
        input.revenueBasis ?? 0,
      );
      const costing = calculateRevenueCosting(
        directCost,
        input.marginPercent,
        costingPercent,
      );
      fixedCostShare = costing.overheadAmount;
      totalCost = costing.totalCost;
      suggestedPrice = costing.suggestedPrice;
    } else {
      totalCost = calculateTotalCost(
        input.ingredientCost,
        input.packagingCost,
        input.laborCost,
        fixedCostShare,
      );
      suggestedPrice = calculateSuggestedPrice(totalCost, input.marginPercent);
    }

    const feesPercent = input.feesPercent ?? 0;
    const { finalPrice, feesAmount } = calculatePriceWithFees(
      suggestedPrice,
      feesPercent,
    );

    return this.repo.create(userId, {
      productId: input.productId,
      ingredientCost: input.ingredientCost,
      packagingCost: input.packagingCost,
      laborCost: input.laborCost,
      fixedCostShare,
      totalCost,
      marginPercent: input.marginPercent,
      suggestedPrice,
      feesPercent,
      feesAmount,
      finalPrice,
      allocationMode,
      monthlyFixedCosts:
        allocationMode === "revenue" ? input.monthlyFixedCosts : undefined,
      revenueBasis: allocationMode === "revenue" ? input.revenueBasis : undefined,
      overheadPercent: costingPercent,
      channelName: input.channelName,
    });
  }

  async getPreferences(userId: string): Promise<PricingPreferences> {
    const stored = await this.repo.getPreferences(userId);
    if (stored) return stored;
    return {
      userId,
      channelFees: [
        { id: "ifood", name: "iFood", percent: 0 },
        { id: "card", name: "Cartão", percent: 0 },
      ],
      updatedAt: new Date(0).toISOString(),
    };
  }

  async updatePreferences(
    userId: string,
    input: UpsertPricingPreferences,
  ): Promise<PricingPreferences> {
    const normalized = input.channelFees.map((item) => ({
      ...item,
      name: item.name.trim(),
    }));
    const names = normalized.map((item) => item.name.toLocaleLowerCase("pt-BR"));
    if (new Set(names).size !== names.length) {
      throw new ValidationError(["Os nomes dos canais precisam ser diferentes"]);
    }
    return this.repo.upsertPreferences(userId, { channelFees: normalized });
  }

  async getById(userId: string, id: string): Promise<Pricing> {
    const item = await this.repo.findById(userId, id);
    if (!item) {
      throw new NotFoundError("Cálculo de precificação não encontrado");
    }
    return item;
  }

  async list(userId: string, opts: FindAllOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items,
      ...paginationMeta(total, opts.page, opts.limit),
    };
  }

  async getHistory(userId: string, productId: string): Promise<Pricing[]> {
    return this.repo.findByProduct(userId, productId);
  }
}
