import type { Client, Sale } from "@lucro-caseiro/contracts";
import { isValidBrazilPhone } from "../../shared/utils/phone";

// ---------------------------------------------------------------------------
// Clientes que sumiram: compravam sempre e não voltam há um tempo
// ---------------------------------------------------------------------------

/** Dias sem comprar a partir dos quais o cliente aparece. */
export const LAPSED_MIN_DAYS = 30;
/** Compras (não canceladas) no período para contar como cliente de costume. */
export const LAPSED_MIN_PURCHASES = 2;
/** Período de vendas analisado: os últimos 180 dias. */
export const LAPSED_LOOKBACK_DAYS = 180;
export const LAPSED_LIMIT = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type LapsedClient = {
  clientId: string;
  name: string;
  phone: string;
  lastSaleAt: string;
  daysAway: number;
  purchases: number;
  spent: number;
};

/** Início do período analisado: meia-noite local de 180 dias atrás, em ISO. */
export function lapsedLookbackStart(now: Date): string {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - LAPSED_LOOKBACK_DAYS,
  ).toISOString();
}

function calendarDaysSince(iso: string, now: Date): number {
  const start = new Date(iso);
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY_MS));
}

/**
 * Clientes com pelo menos 2 compras no período, a última há 30 dias ou mais e
 * telefone válido para o WhatsApp. Ordem: quem mais gastou no período primeiro;
 * empate, quem está há mais tempo sem comprar; depois o nome.
 */
export function lapsedClients(
  clients: readonly Pick<Client, "id" | "name" | "phone">[],
  sales: readonly Pick<Sale, "clientId" | "status" | "soldAt" | "total">[],
  now: Date,
  limit = LAPSED_LIMIT,
): LapsedClient[] {
  const stats = new Map<string, { purchases: number; spent: number; last: string }>();
  for (const sale of sales) {
    if (!sale.clientId || sale.status === "cancelled") continue;
    const entry = stats.get(sale.clientId) ?? {
      purchases: 0,
      spent: 0,
      last: sale.soldAt,
    };
    entry.purchases += 1;
    entry.spent += sale.total;
    if (new Date(sale.soldAt) > new Date(entry.last)) entry.last = sale.soldAt;
    stats.set(sale.clientId, entry);
  }

  const result: LapsedClient[] = [];
  for (const client of clients) {
    const entry = stats.get(client.id);
    const phone = client.phone?.trim();
    if (!entry || !phone || !isValidBrazilPhone(phone)) continue;
    if (entry.purchases < LAPSED_MIN_PURCHASES) continue;
    const daysAway = calendarDaysSince(entry.last, now);
    if (daysAway < LAPSED_MIN_DAYS) continue;
    result.push({
      clientId: client.id,
      name: client.name,
      phone,
      lastSaleAt: entry.last,
      daysAway,
      purchases: entry.purchases,
      spent: Math.round(entry.spent * 100) / 100,
    });
  }

  result.sort(
    (a, b) =>
      b.spent - a.spent ||
      b.daysAway - a.daysAway ||
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  );
  return result.slice(0, limit);
}

/** "Última compra há 45 dias". */
export function lastPurchaseLabel(daysAway: number): string {
  return daysAway === 1 ? "Última compra há 1 dia" : `Última compra há ${daysAway} dias`;
}

/** Mensagem curta e simpática para chamar o cliente de volta. */
export function lapsedClientMessage(input: {
  clientName: string;
  businessName?: string | null;
  service?: boolean;
}): string {
  const first = input.clientName.trim().split(/\s+/)[0];
  const hello = first ? `Oi, ${first}! Tudo bem?` : "Oi! Tudo bem?";
  const business = input.businessName?.trim();
  const from = business ? ` Aqui é da ${business}.` : "";
  const ask = input.service
    ? "Quer agendar um horário esta semana?"
    : "Quer fazer um pedido esta semana?";
  return `${hello}${from} Faz tempo que você não aparece e lembrei de você. ${ask} 😊`;
}
