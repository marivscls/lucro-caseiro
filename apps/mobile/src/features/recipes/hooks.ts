import type { CreateRecipe, UpdateRecipe } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  createIngredient,
  createRecipe,
  deleteRecipe,
  fetchIngredients,
  fetchRecipe,
  fetchRecipes,
  scaleRecipe,
  updateRecipe,
} from "./api";

const RECIPES_KEY = ["recipes"];
const INGREDIENTS_KEY = ["ingredients"];

export function useRecipes(opts?: { page?: number; category?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...RECIPES_KEY, opts],
    queryFn: () => fetchRecipes(token!, opts),
    enabled: !!token,
  });
}

export function useRecipe(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...RECIPES_KEY, id],
    queryFn: () => fetchRecipe(token!, id),
    enabled: !!token && !!id,
  });
}

export function useScaleRecipe(id: string, multiplier: number) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...RECIPES_KEY, id, "scale", multiplier],
    queryFn: () => scaleRecipe(token!, id, multiplier),
    enabled: !!token && !!id && multiplier !== 1,
  });
}

export function useCreateRecipe() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecipe) => createRecipe(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPES_KEY });
    },
  });
}

export function useUpdateRecipe() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipe }) =>
      updateRecipe(token!, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPES_KEY });
    },
  });
}

export function useDeleteRecipe() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecipe(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPES_KEY });
    },
  });
}

export function useIngredients(opts?: { page?: number; search?: string }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, opts],
    queryFn: () => fetchIngredients(token!, opts),
    enabled: !!token,
  });
}

export function useCreateIngredient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      price: number;
      quantityPerPackage: number;
      unit: string;
      supplier?: string;
    }) => createIngredient(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY });
    },
  });
}
