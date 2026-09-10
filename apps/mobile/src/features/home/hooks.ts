import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../shared/hooks/use-auth";
import { fetchSales } from "../sales/api";
import { fetchAllProducts } from "../products/api";

export async function fetchPendingSales(token: string) {
  const first = await fetchSales(token, { status: "pending", page: 1 });
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await fetchSales(token, { status: "pending", page });
    items.push(...next.items);
  }
  return { ...first, items, total: items.length };
}

export function useHomePendingSales() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["sales", "home-pending"],
    queryFn: () => fetchPendingSales(token!),
    enabled: !!token,
  });
}

export function useHomeProducts(enabled: boolean) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["products", "home-attention"],
    queryFn: async () => ({ items: await fetchAllProducts(token!) }),
    enabled: !!token && enabled,
  });
}
