import type {
  CreateProductionRun,
  ProductionRun,
} from "@lucro-caseiro/contracts";

import { ValidationError } from "../../shared/errors";
import { calculateProductionCosts } from "./production.domain";
import type { ProductionRepoPg } from "./production.repo.pg";

export class ProductionUseCases {
  constructor(private repo: ProductionRepoPg) {}

  async close(userId: string, data: CreateProductionRun): Promise<ProductionRun> {
    if (!data.productId && !data.recipeId) {
      throw new ValidationError(["Escolha um produto ou uma receita"]);
    }
    const costs = calculateProductionCosts(data.materials);
    try {
      return await this.repo.create(userId, data, costs);
    } catch (error) {
      throw new ValidationError([
        error instanceof Error ? error.message : "Não foi possível fechar a produção",
      ]);
    }
  }

  list(userId: string, limit: number): Promise<ProductionRun[]> {
    return this.repo.list(userId, limit);
  }
}
