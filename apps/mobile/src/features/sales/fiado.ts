import type { Sale } from "@lucro-caseiro/contracts";

import { formatCurrency } from "../../shared/utils/format";

export interface FiadoGroup {
  clientId: string | null;
  clientName: string;
  total: number;
  sales: Sale[];
}

export type FiadoTiming =
  | { kind: "overdue"; days: number }
  | { kind: "upcoming"; days: number }
  | { kind: "open"; days: number };

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FIADO_DUE_AFTER_DAYS = 7;
const FIADO_UPCOMING_WINDOW_DAYS = 3;

function startOfLocalDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

/**
 * Mantém a regra histórica da tela: um fiado entra em atraso após 7 dias.
 * Os três dias anteriores formam a faixa de vencimento próximo.
 */
export function fiadoTiming(soldAt: string, now = new Date()): FiadoTiming {
  const soldDay = startOfLocalDay(new Date(soldAt));
  const today = startOfLocalDay(now);
  const daysUntilDue = Math.round(
    (soldDay + FIADO_DUE_AFTER_DAYS * DAY_IN_MS - today) / DAY_IN_MS,
  );

  if (daysUntilDue <= 0) return { kind: "overdue", days: Math.abs(daysUntilDue) };
  if (daysUntilDue <= FIADO_UPCOMING_WINDOW_DAYS) {
    return { kind: "upcoming", days: daysUntilDue };
  }
  return { kind: "open", days: daysUntilDue };
}

function dateBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const firstName = (name: string) => name.trim().split(" ")[0] ?? name;

/** Vendas em aberto (fiado) = status pendente. */
export function openFiados(sales: Sale[]): Sale[] {
  return sales.filter((s) => s.status === "pending");
}

/** Soma total devida em uma lista de vendas. */
export function totalOwed(sales: Sale[]): number {
  return sales.reduce((sum, sale) => sum + Math.max(0, sale.total - sale.paidAmount), 0);
}

/**
 * Agrupa vendas em aberto por cliente (sem cliente vira "Cliente avulso"),
 * ordenado pelo maior valor devido.
 */
export function groupFiados(sales: Sale[]): FiadoGroup[] {
  const map = new Map<string, FiadoGroup>();
  for (const sale of openFiados(sales)) {
    const key = sale.clientId ?? "__avulso__";
    const existing = map.get(key);
    if (existing) {
      existing.sales.push(sale);
      existing.total += Math.max(0, sale.total - sale.paidAmount);
    } else {
      map.set(key, {
        clientId: sale.clientId,
        clientName: sale.clientName ?? "Cliente avulso",
        total: Math.max(0, sale.total - sale.paidAmount),
        sales: [sale],
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Fiados "antigos": pendentes há pelo menos `minAgeDays` dias. */
export function oldFiadoSummary(
  sales: Sale[],
  now: Date,
  minAgeDays = 7,
): { count: number; total: number } {
  const cutoff = now.getTime() - minAgeDays * 24 * 60 * 60 * 1000;
  const old = openFiados(sales).filter((s) => new Date(s.soldAt).getTime() <= cutoff);
  return { count: old.length, total: totalOwed(old) };
}

/** Mensagem de cobrança gentil (pt-BR) com os valores em aberto do cliente. */
export function buildChargeMessage(group: FiadoGroup): string {
  const lines: string[] = [];
  const hello = group.clientId ? `Oi, ${firstName(group.clientName)}!` : "Oi!";
  lines.push(`${hello} Passando para lembrar do valor em aberto:`);
  lines.push("");
  for (const sale of group.sales) {
    lines.push(
      `• ${dateBR(sale.soldAt)}: ${formatCurrency(
        Math.max(0, sale.total - sale.paidAmount),
      )}`,
    );
  }
  lines.push("");
  lines.push(`*Total: ${formatCurrency(group.total)}*`);
  lines.push("Quando puder acertar, é só me chamar. Obrigada! 💛");
  return lines.join("\n");
}
