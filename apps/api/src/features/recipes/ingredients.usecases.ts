import type { Ingredient } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateIngredientData } from "./ingredients.domain";
import type {
  CreateIngredientData,
  FindAllOpts,
  IIngredientsRepo,
} from "./ingredients.types";

export class IngredientsUseCases {
  constructor(private repo: IIngredientsRepo) {}

  async create(userId: string, data: CreateIngredientData): Promise<Ingredient> {
    const errors = validateIngredientData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Ingredient> {
    const ingredient = await this.repo.findById(userId, id);
    if (!ingredient) {
      throw new NotFoundError("Ingrediente nao encontrado");
    }
    return ingredient;
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
    data: Partial<CreateIngredientData>,
  ): Promise<Ingredient> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Ingrediente nao encontrado");
    }

    const merged = { ...existing, ...data };
    const errors = validateIngredientData({
      name: merged.name,
      price: merged.price,
      quantityPerPackage: merged.quantityPerPackage,
      unit: merged.unit,
      supplier: merged.supplier ?? undefined,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Ingrediente nao encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Ingrediente nao encontrado");
    }
  }
}
