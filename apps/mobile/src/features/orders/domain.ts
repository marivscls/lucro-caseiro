import type { Order, OrderStatus } from "@lucro-caseiro/contracts";

import { isoToBR } from "../../shared/utils/date";

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
  return isoToBR(iso);
}

export function agendaDateLimit(isDesktop: boolean): number {
  return isDesktop ? 7 : 5;
}

export interface AgendaStripDay {
  /** YYYY-MM-DD local. */
  date: string;
  day: number;
  /** "Hoje" no primeiro dia; depois o dia da semana curto ("qui"). */
  label: string;
  count: number;
}

function shortWeekday(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");
}

/** Próximos `limit` dias a partir de hoje, com a contagem de encomendas de cada um. */
export function agendaStripDays(
  options: ReadonlyArray<{ date: string; count: number }>,
  today: Date,
  limit: number,
): AgendaStripDay[] {
  const countByDate = new Map(options.map((option) => [option.date, option.count]));
  return Array.from({ length: limit }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    const iso = ymd(date);
    return {
      date: iso,
      day: date.getDate(),
      label: index === 0 ? "Hoje" : shortWeekday(date),
      count: countByDate.get(iso) ?? 0,
    };
  });
}

/** "Livre", "1 encomenda", "3 encomendas" (o substantivo vem do tipo de negócio). */
export function agendaDayCountLabel(
  count: number,
  noun: { singular: string; plural: string },
): string {
  if (count === 0) return "Livre";
  return `${count} ${count === 1 ? noun.singular : noun.plural}`;
}

export interface AgendaTimelineSlot {
  /** "08:00", "08:30"… */
  label: string;
  /** Serviço ou encomenda que ocupa o horário; null quando livre. */
  busyWith: string | null;
}

/**
 * Horários de 30 min entre 8h e 18h. Um horário fica ocupado por encomendas
 * ativas com hora marcada, pela duração informada (60 min por padrão).
 */
export function agendaTimelineSlots(orders: readonly Order[]): AgendaTimelineSlot[] {
  return Array.from({ length: 20 }, (_, index) => {
    const minutes = 8 * 60 + index * 30;
    const order = orders.find((candidate) => {
      if (
        candidate.deliveryTime === null ||
        candidate.status === "done" ||
        candidate.status === "cancelled"
      ) {
        return false;
      }
      const [hours, mins] = candidate.deliveryTime.split(":").map(Number);
      const start = hours * 60 + mins;
      const end = start + (candidate.durationMinutes ?? 60);
      return minutes >= start && minutes < end;
    });
    return {
      label: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
        minutes % 60,
      ).padStart(2, "0")}`,
      busyWith: order ? (order.serviceName ?? order.title) : null,
    };
  });
}

export function agendaSummaryLabels(selectedDate: string | null): {
  title: string;
  total: string;
} {
  return selectedDate
    ? { title: "Resumo do dia", total: "Total do dia" }
    : { title: "Resumo geral", total: "Todos os pedidos" };
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
