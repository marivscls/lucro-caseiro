import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../shared/hooks/use-auth";
import { fetchAllProducts } from "../products/api";
import { fetchAllRecipes } from "../recipes/api";
import { fetchPackagingList } from "../packaging/api";
import { fetchPricingList } from "./api";

async function allPages<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; totalPages: number }>,
) {
  const first = await fetchPage(1);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++)
    items.push(...(await fetchPage(page)).items);
  return items;
}

export function usePricingSources() {
  const { token, userId } = useAuth();
  const query = useQuery({
    queryKey: ["pricing-sources", userId],
    enabled: !!token,
    staleTime: 0,
    queryFn: async () => {
      const [products, recipes, packaging, calculations] = await Promise.all([
        fetchAllProducts(token!),
        fetchAllRecipes(token!),
        allPages((page) => fetchPackagingList(token!, { page })),
        allPages((page) => fetchPricingList(token!, { page, limit: 100 })),
      ]);
      return { products, recipes, packaging, calculations };
    },
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (token) void refetch();
    }, [refetch, token]),
  );
  return query;
}
