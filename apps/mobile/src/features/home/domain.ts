import type { Order, Product, Sale } from "@lucro-caseiro/contracts";
import type { AppIconName } from "../../shared/components/app-icon";

export type QueryState = "loading" | "error" | "stale" | "ready";
export function queryState(query: { data: unknown; isError: boolean }): QueryState {
  if (query.data === undefined) return query.isError ? "error" : "loading";
  return query.isError ? "stale" : "ready";
}

export function nextAppointments(orders: Order[]): Order[] {
  return orders
    .filter(
      (order) =>
        !["done", "cancelled"].includes(order.status) &&
        !["completed", "cancelled", "no_show"].includes(order.appointmentStatus ?? ""),
    )
    .sort((a, b) =>
      `${a.deliveryDate.slice(0, 10)} ${a.deliveryTime ?? "23:59"}`.localeCompare(
        `${b.deliveryDate.slice(0, 10)} ${b.deliveryTime ?? "23:59"}`,
      ),
    );
}

export function pendingReceipts(sales: Sale[]) {
  return sales.reduce(
    (result, sale) => {
      const amount =
        sale.status === "pending" ? Math.max(0, sale.total - sale.paidAmount) : 0;
      return { total: result.total + amount, count: result.count + (amount > 0 ? 1 : 0) };
    },
    { total: 0, count: 0 },
  );
}

export function dayAppointments(orders: Order[], today: string): Order[] {
  const open = nextAppointments(orders);
  const past = open.filter((order) => order.deliveryDate.slice(0, 10) < today);
  const next = open.filter((order) => order.deliveryDate.slice(0, 10) >= today);
  return next.length
    ? [...past.slice(0, 2), ...next.slice(0, Math.max(1, 3 - past.length))]
    : past.slice(0, 3);
}

export type HomeAction = { label: string; route: string; icon: AppIconName };
export function quickActions(service: boolean, scheduling: boolean): HomeAction[] {
  return [
    service && scheduling
      ? {
          label: "Agendar atendimento",
          route: "/tabs/agenda?create=home",
          icon: "calendar-outline",
        }
      : { label: "Nova venda", route: "/tabs/new-sale", icon: "add" },
    service
      ? { label: "Serviços", route: "/services", icon: "briefcase-outline" }
      : { label: "Produtos", route: "/products", icon: "cube-outline" },
    { label: "Calcular preço", route: "/pricing", icon: "calculator-outline" },
    { label: "Anotar despesa", route: "/finance?create=expense", icon: "cash-outline" },
  ] as HomeAction[];
}

export type HomeAlert = {
  id: string;
  title: string;
  detail: string;
  route: string;
  icon: AppIconName;
};
export function homeAttention(products: Product[]): HomeAlert[] {
  const alerts: HomeAlert[] = [];
  for (const product of products) {
    if (product.isActive === false) continue;
    const tracked =
      product.saleUnit === "unit" &&
      !product.isComposite &&
      product.stockAlertThreshold != null;
    const low =
      tracked &&
      (product.variations?.length
        ? product.variations.some(
            (v) =>
              v.stockQuantity != null && v.stockQuantity <= product.stockAlertThreshold!,
          )
        : product.stockQuantity != null &&
          product.stockQuantity <= product.stockAlertThreshold!);
    if (low)
      alerts.push({
        id: `stock-${product.id}`,
        title: `Repor: ${product.name}`,
        detail: "Estoque no limite de reposição que você definiu.",
        route: `/products?productId=${encodeURIComponent(product.id)}`,
        icon: "cube-outline",
      });
    if (product.costPrice != null && product.salePrice < product.costPrice)
      alerts.push({
        id: `price-${product.id}`,
        title: `Revisar preço: ${product.name}`,
        detail: "O preço está abaixo do custo cadastrado.",
        route: `/products?productId=${encodeURIComponent(product.id)}`,
        icon: "calculator-outline",
      });
  }
  return alerts.slice(0, 3);
}
