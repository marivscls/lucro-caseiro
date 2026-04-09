import type { Product } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateProductData } from "./products.domain";
import type { CreateProductData, FindAllOpts, IProductsRepo } from "./products.types";

export class ProductsUseCases {
  constructor(private repo: IProductsRepo) {}

  async create(userId: string, data: CreateProductData): Promise<Product> {
    const errors = validateProductData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Product> {
    const product = await this.repo.findById(userId, id);
    if (!product) {
      throw new NotFoundError("Produto nao encontrado");
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
      throw new NotFoundError("Produto nao encontrado");
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

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Produto nao encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Produto nao encontrado");
    }
  }
}
