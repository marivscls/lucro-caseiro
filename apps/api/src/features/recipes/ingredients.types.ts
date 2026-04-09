import type { Ingredient } from "@lucro-caseiro/contracts";

export interface IIngredientsRepo {
  create(userId: string, data: CreateIngredientData): Promise<Ingredient>;
  findById(userId: string, id: string): Promise<Ingredient | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Ingredient[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateIngredientData>,
  ): Promise<Ingredient | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface CreateIngredientData {
  name: string;
  price: number;
  quantityPerPackage: number;
  unit: string;
  supplier?: string;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  search?: string;
}
