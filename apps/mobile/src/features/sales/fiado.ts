import type { Sale } from "@lucro-caseiro/contracts";

import { formatCurrency } from "../../shared/utils/format";

export interface FiadoGroup {
  clientId: string | null;
  clientName: string;
  total: number;
  sales: Sale[];
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
  return sales.reduce((sum, s) => sum + s.total, 0);
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
      existing.total += sale.total;
    } else {
      map.set(key, {
        clientId: sale.clientId,
        clientName: sale.clientName ?? "Cliente avulso",
        total: sale.total,
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
    lines.push(`• ${dateBR(sale.soldAt)}: ${formatCurrency(sale.total)}`);
  }
  lines.push("");
  lines.push(`*Total: ${formatCurrency(group.total)}*`);
  lines.push("Quando puder acertar, é só me chamar. Obrigada! 💛");
  return lines.join("\n");
}
