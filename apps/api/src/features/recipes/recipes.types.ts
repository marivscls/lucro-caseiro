import type { Recipe, RecipeIngredient } from "@lucro-caseiro/contracts";

export interface IRecipesRepo {
  create(userId: string, data: CreateRecipeData): Promise<Recipe>;
  findById(userId: string, id: string): Promise<Recipe | null>;
  findAll(userId: string, opts: FindAllOpts): Promise<{ items: Recipe[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateRecipeData>,
  ): Promise<Recipe | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface CreateRecipeData {
  name: string;
  category: string;
  instructions?: string;
  yieldQuantity: number;
  yieldUnit: string;
  photoUrl?: string;
  ingredients: RecipeIngredient[];
}

export interface FindAllOpts {
  page: number;
  limit: number;
  category?: string;
  search?: string;
}

export interface IngredientWithPrice {
  ingredientId: string;
  ingredientName: string;
  ingredientPrice: number;
  quantity: number;
  unit: string;
  quantityPerPackage: number;
}
