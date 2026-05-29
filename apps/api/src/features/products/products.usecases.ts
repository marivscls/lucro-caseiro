import type { Product } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateProductData } from "./products.domain";
import type {
  CreateProductData,
  FindAllOpts,
  IProductsRepo,
  IRecipeCostProvider,
} from "./products.types";

export class ProductsUseCases {
  constructor(
    private repo: IProductsRepo,
    private recipeCost?: IRecipeCostProvider,
  ) {}

  /**
   * Quando o produto tem receita, o custo real vem do `costPerUnit` da receita
   * (custo dos insumos). Caso contrário, mantém o costPrice informado.
   */
  private async resolveCostPrice(
    userId: string,
    recipeId: string | undefined,
    fallback: number | undefined,
  ): Promise<number | undefined> {
    if (recipeId && this.recipeCost) {
      const cost = await this.recipeCost.getCostPerUnit(userId, recipeId);
      if (cost != null) return cost;
    }
    return fallback;
  }

  async create(userId: string, data: CreateProductData): Promise<Product> {
    const errors = validateProductData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const costPrice = await this.resolveCostPrice(userId, data.recipeId, data.costPrice);
    return this.repo.create(userId, { ...data, costPrice });
  }

  async getById(userId: string, id: string): Promise<Product> {
    const product = await this.repo.findById(userId, id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado");
    }
    return product;
  }

  async list(userId: string, opts: FindAllOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items,
      ...paginationMeta(total, opts.page, opts.limit),
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateProductData>,
  ): Promise<Product> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Produto não encontrado");
    }

    const merged = { ...existing, ...data };
    const errors = validateProductData({
      name: merged.name,
      salePrice: merged.salePrice,
      category: merged.category,
      description: merged.description ?? undefined,
      photoUrl: merged.photoUrl ?? undefined,
      recipeId: merged.recipeId ?? undefined,
      stockQuantity: merged.stockQuantity ?? undefined,
      stockAlertThreshold: merged.stockAlertThreshold ?? undefined,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    // Se a receita foi (re)definida, recalcula o custo real a partir dela.
    const dataWithCost = { ...data };
    if (data.recipeId !== undefined) {
      const cost = await this.resolveCostPrice(userId, data.recipeId, data.costPrice);
      if (cost !== undefined) dataWithCost.costPrice = cost;
    }

    const updated = await this.repo.update(userId, id, dataWithCost);
    if (!updated) {
      throw new NotFoundError("Produto não encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Produto não encontrado");
    }
  }

  /** Preço médio de venda dos produtos ativos (null se não houver produtos). */
  async averageActivePrice(userId: string): Promise<number | null> {
    return this.repo.averageActivePrice(userId);
  }
}
