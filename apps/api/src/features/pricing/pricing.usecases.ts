import type { Pricing } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import {
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
}

export class PricingUseCases {
  constructor(private repo: IPricingRepo) {}

  async calculate(userId: string, input: CalculateInput): Promise<Pricing> {
    const errors = validatePricingData(input);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const totalCost = calculateTotalCost(
      input.ingredientCost,
      input.packagingCost,
      input.laborCost,
      input.fixedCostShare,
    );

    const suggestedPrice = calculateSuggestedPrice(totalCost, input.marginPercent);

    return this.repo.create(userId, {
      productId: input.productId,
      ingredientCost: input.ingredientCost,
      packagingCost: input.packagingCost,
      laborCost: input.laborCost,
      fixedCostShare: input.fixedCostShare,
      totalCost,
      marginPercent: input.marginPercent,
      suggestedPrice,
    });
  }

  async getById(userId: string, id: string): Promise<Pricing> {
    const item = await this.repo.findById(userId, id);
    if (!item) {
      throw new NotFoundError("Calculo de precificacao nao encontrado");
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
