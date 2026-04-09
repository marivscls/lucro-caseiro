import type {
  CreateRecipe,
  Ingredient,
  Recipe,
  UpdateRecipe,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const RECIPES_BASE = "/api/v1/recipes";
const INGREDIENTS_BASE = "/api/v1/ingredients";

export interface PaginatedRecipes {
  items: Recipe[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedIngredients {
  items: Ingredient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Recipes
export async function fetchRecipes(
  token: string,
  opts?: { page?: number; category?: string },
): Promise<PaginatedRecipes> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.category) params.set("category", opts.category);
  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedRecipes>(`${RECIPES_BASE}${queryString}`, { token });
}

export async function fetchRecipe(token: string, id: string): Promise<Recipe> {
  return apiClient<Recipe>(`${RECIPES_BASE}/${id}`, { token });
}

export async function createRecipe(token: string, data: CreateRecipe): Promise<Recipe> {
  return apiClient<Recipe>(RECIPES_BASE, { method: "POST", body: data, token });
}

export async function updateRecipe(
  token: string,
  id: string,
  data: UpdateRecipe,
): Promise<Recipe> {
  return apiClient<Recipe>(`${RECIPES_BASE}/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export async function deleteRecipe(token: string, id: string): Promise<void> {
  await apiClient(`${RECIPES_BASE}/${id}`, { method: "DELETE", token });
}

export async function scaleRecipe(
  token: string,
  id: string,
  multiplier: number,
): Promise<Recipe> {
  return apiClient<Recipe>(`${RECIPES_BASE}/${id}/scale?multiplier=${multiplier}`, {
    token,
  });
}

// Ingredients
export async function fetchIngredients(
  token: string,
  opts?: { page?: number; search?: string },
): Promise<PaginatedIngredients> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.search) params.set("search", opts.search);
  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  return apiClient<PaginatedIngredients>(`${INGREDIENTS_BASE}${queryString}`, { token });
}

export async function createIngredient(
  token: string,
  data: {
    name: string;
    price: number;
    quantityPerPackage: number;
    unit: string;
    supplier?: string;
  },
): Promise<Ingredient> {
  return apiClient<Ingredient>(INGREDIENTS_BASE, { method: "POST", body: data, token });
}
