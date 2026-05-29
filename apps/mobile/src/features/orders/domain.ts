import type { Order, OrderStatus } from "@lucro-caseiro/contracts";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "A fazer",
  in_production: "Produzindo",
  ready: "Pronto",
  done: "Entregue",
  cancelled: "Cancelada",
};

// Tom semântico p/ cor (o componente mapeia pro tema).
export type StatusTone = "muted" | "info" | "warn" | "success" | "danger";
export const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  pending: "muted",
  in_production: "info",
  ready: "warn",
  done: "success",
  cancelled: "danger",
};

export interface OrderGroup {
  key: string;
  title: string;
  orders: Order[];
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + days);
  return r;
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Agrupa encomendas em Atrasadas / Hoje / Amanhã / Esta semana / Próximas, com
 * Finalizadas (entregues/canceladas) por último. Datas são strings YYYY-MM-DD
 * (comparação lexicográfica = cronológica). Grupos vazios são omitidos.
 */
export function groupOrders(orders: Order[], today: Date): OrderGroup[] {
  const todayStr = ymd(today);
  const tomorrowStr = ymd(addDays(today, 1));
  const weekEndStr = ymd(addDays(today, 7));

  const overdue: Order[] = [];
  const todayOrders: Order[] = [];
  const tomorrow: Order[] = [];
  const week: Order[] = [];
  const later: Order[] = [];
  const finished: Order[] = [];

  for (const o of orders) {
    if (o.status === "done" || o.status === "cancelled") {
      finished.push(o);
      continue;
    }
    const d = o.deliveryDate;
    if (d < todayStr) overdue.push(o);
    else if (d === todayStr) todayOrders.push(o);
    else if (d === tomorrowStr) tomorrow.push(o);
    else if (d <= weekEndStr) week.push(o);
    else later.push(o);
  }

  const groups: OrderGroup[] = [];
  const push = (key: string, title: string, list: Order[]) => {
    if (list.length > 0) groups.push({ key, title, orders: list });
  };
  push("overdue", "Atrasadas", overdue);
  push("today", "Hoje", todayOrders);
  push("tomorrow", "Amanhã", tomorrow);
  push("week", "Esta semana", week);
  push("later", "Próximas", later);
  push("finished", "Finalizadas", finished);
  return groups;
}

/** Encomendas ativas (não finalizadas) com entrega hoje ou amanhã — p/ Home. */
export function upcomingCount(orders: Order[], today: Date): number {
  const todayStr = ymd(today);
  const tomorrowStr = ymd(addDays(today, 1));
  return orders.filter(
    (o) =>
      o.status !== "done" &&
      o.status !== "cancelled" &&
      (o.deliveryDate === todayStr ||
        o.deliveryDate === tomorrowStr ||
        o.deliveryDate < todayStr),
  ).length;
}
