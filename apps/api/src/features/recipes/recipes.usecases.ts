import type { Recipe, RecipeIngredient } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { scaleRecipe, validateRecipeData } from "./recipes.domain";
import type { CreateRecipeData, FindAllOpts, IRecipesRepo } from "./recipes.types";

export class RecipesUseCases {
  constructor(private repo: IRecipesRepo) {}

  async create(userId: string, data: CreateRecipeData): Promise<Recipe> {
    const errors = validateRecipeData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Recipe> {
    const recipe = await this.repo.findById(userId, id);
    if (!recipe) {
      throw new NotFoundError("Receita nao encontrada");
    }
    return recipe;
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
    data: Partial<CreateRecipeData>,
  ): Promise<Recipe> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Receita nao encontrada");
    }

    const merged = {
      name: data.name ?? existing.name,
      category: data.category ?? existing.category,
      instructions: data.instructions ?? existing.instructions ?? undefined,
      yieldQuantity: data.yieldQuantity ?? existing.yieldQuantity,
      yieldUnit: data.yieldUnit ?? existing.yieldUnit,
      photoUrl: data.photoUrl ?? existing.photoUrl ?? undefined,
      ingredients: data.ingredients ?? existing.ingredients,
    };

    const errors = validateRecipeData(merged);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Receita nao encontrada");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Receita nao encontrada");
    }
  }

  async scale(
    userId: string,
    id: string,
    multiplier: number,
  ): Promise<{ ingredients: RecipeIngredient[]; yieldQuantity: number }> {
    const recipe = await this.repo.findById(userId, id);
    if (!recipe) {
      throw new NotFoundError("Receita nao encontrada");
    }

    const scaledIngredients = scaleRecipe(recipe.ingredients, multiplier);
    const scaledYield = recipe.yieldQuantity * multiplier;

    return {
      ingredients: scaledIngredients,
      yieldQuantity: scaledYield,
    };
  }
}
