import type { Client, Sale } from "@lucro-caseiro/contracts";

export type ClientListFilter = "all" | "recent" | "frequent" | "credit";
export type ClientListSort = "recent" | "alphabetical" | "highest" | "frequent";

export interface ClientListInsight {
  client: Client;
  lastSaleAt: string | null;
  monthOrders: number;
  pendingTotal: number;
  saleCount: number;
  frequent: boolean;
}

function isFrequentTag(tag: string): boolean {
  return tag.toLocaleLowerCase("pt-BR").includes("frequen");
}

export function buildClientListInsights(
  clients: readonly Client[],
  sales: readonly Sale[],
  now = new Date(),
): ClientListInsight[] {
  const month = now.getMonth();
  const year = now.getFullYear();
  const salesByClient = new Map<string, Sale[]>();

  for (const sale of sales) {
    if (!sale.clientId || sale.status === "cancelled") continue;
    const current = salesByClient.get(sale.clientId) ?? [];
    current.push(sale);
    salesByClient.set(sale.clientId, current);
  }

  return clients.map((client) => {
    const clientSales = salesByClient.get(client.id) ?? [];
    const monthOrders = clientSales.filter((sale) => {
      const soldAt = new Date(sale.soldAt);
      return soldAt.getMonth() === month && soldAt.getFullYear() === year;
    }).length;
    const pendingTotal = clientSales.reduce(
      (sum, sale) =>
        sale.status === "pending" ? sum + Math.max(0, sale.total - sale.paidAmount) : sum,
      0,
    );
    const lastSaleAt = clientSales.reduce<string | null>((latest, sale) => {
      if (!latest) return sale.soldAt;
      return new Date(sale.soldAt) > new Date(latest) ? sale.soldAt : latest;
    }, null);
    const frequent = client.tags.some(isFrequentTag) || clientSales.length >= 4;

    return {
      client,
      lastSaleAt,
      monthOrders,
      pendingTotal,
      saleCount: clientSales.length,
      frequent,
    };
  });
}

function recentThresholdDate(now: Date): Date {
  const recentThreshold = new Date(now);
  recentThreshold.setDate(recentThreshold.getDate() - 30);
  return recentThreshold;
}

export function matchesClientListFilter(
  insight: ClientListInsight,
  filter: ClientListFilter,
  now = new Date(),
): boolean {
  if (filter === "recent") {
    const recentThreshold = recentThresholdDate(now);
    return Boolean(insight.lastSaleAt && new Date(insight.lastSaleAt) >= recentThreshold);
  }
  if (filter === "frequent") return insight.frequent;
  if (filter === "credit") return insight.pendingTotal > 0;
  return true;
}

export function countClientListFilters(
  insights: readonly ClientListInsight[],
  now = new Date(),
): Record<ClientListFilter, number> {
  const counts: Record<ClientListFilter, number> = {
    all: insights.length,
    recent: 0,
    frequent: 0,
    credit: 0,
  };

  for (const insight of insights) {
    if (matchesClientListFilter(insight, "recent", now)) counts.recent += 1;
    if (matchesClientListFilter(insight, "frequent", now)) counts.frequent += 1;
    if (matchesClientListFilter(insight, "credit", now)) counts.credit += 1;
  }

  return counts;
}

/** Ordem alfabética pt-BR, sem diferenciar maiúsculas nem acentos. */
function compareClientNames(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

export function filterAndSortClientInsights(
  insights: readonly ClientListInsight[],
  filter: ClientListFilter,
  sort: ClientListSort,
  now = new Date(),
): ClientListInsight[] {
  const filtered = insights.filter((insight) =>
    matchesClientListFilter(insight, filter, now),
  );

  return [...filtered].sort((a, b) => {
    if (sort === "alphabetical") {
      return compareClientNames(a.client.name, b.client.name);
    }
    if (sort === "highest") return b.client.totalSpent - a.client.totalSpent;
    if (sort === "frequent") {
      return (
        Number(b.frequent) - Number(a.frequent) ||
        b.saleCount - a.saleCount ||
        compareClientNames(a.client.name, b.client.name)
      );
    }

    const aTime = a.lastSaleAt ? new Date(a.lastSaleAt).getTime() : 0;
    const bTime = b.lastSaleAt ? new Date(b.lastSaleAt).getTime() : 0;
    return bTime - aTime || compareClientNames(a.client.name, b.client.name);
  });
}

/** "Comprou hoje", "Comprou há 1 dia", "Comprou há N dias". */
export function daysAgoLabel(date: string, now = new Date()): string {
  const difference = Math.max(
    0,
    Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000),
  );
  if (difference === 0) return "Comprou hoje";
  if (difference === 1) return "Comprou há 1 dia";
  return `Comprou há ${difference} dias`;
}

/** Linha secundária do cliente na lista: pedidos no mês ou última compra. */
export function clientSecondaryLabel(
  insight: ClientListInsight,
  now = new Date(),
): string {
  if (insight.monthOrders > 1) {
    return `${insight.monthOrders} pedidos neste mês`;
  }
  if (insight.lastSaleAt) return daysAgoLabel(insight.lastSaleAt, now);
  return "Sem compras registradas";
}
