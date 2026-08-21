import type { Purchase } from "@lucro-caseiro/contracts";

export type PurchasePayload = Omit<Purchase, "items"> & {
  items?: Purchase["items"] | null;
};

/** Mantém o app compatível com respostas da API anteriores a purchase_items. */
export function normalizePurchase(purchase: PurchasePayload): Purchase {
  return {
    ...purchase,
    items: Array.isArray(purchase.items) ? purchase.items : [],
  };
}

export const PURCHASE_CATEGORIES = [
  { value: "material", label: "Insumo" },
  { value: "packaging", label: "Embalagem" },
  { value: "transport", label: "Transporte" },
  { value: "fee", label: "Taxa" },
  { value: "utility", label: "Utilidade" },
  { value: "other", label: "Outro" },
] as const;

export type PurchaseCategoryValue = (typeof PURCHASE_CATEGORIES)[number]["value"];

export function categoryLabel(value: string): string {
  return PURCHASE_CATEGORIES.find((c) => c.value === value)?.label ?? "Outro";
}

/** Soma dos valores das compras ainda não pagas (total a pagar). */
export function pendingTotal(items: Purchase[]): number {
  return items
    .filter((p) => p.paymentStatus === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
}

export function pendingCountLabel(count: number): string {
  return count === 1 ? "1 compra pendente" : `${count} compras pendentes`;
}

export function purchaseFilterCounts(items: readonly Purchase[]): {
  all: number;
  pending: number;
  paid: number;
} {
  let pending = 0;
  let paid = 0;
  for (const purchase of items) {
    if (purchase.paymentStatus === "pending") pending += 1;
    else paid += 1;
  }
  return { all: items.length, pending, paid };
}

/** Mais recentes primeiro (data da compra, depois criação). */
export function sortPurchasesMostRecentFirst(items: readonly Purchase[]): Purchase[] {
  return [...items].sort((a, b) => {
    const byPurchaseDate = b.purchasedAt.localeCompare(a.purchasedAt);
    if (byPurchaseDate !== 0) return byPurchaseDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Mantém contas a pagar no topo sem alterar a ordem dentro de cada grupo. */
export function sortPurchasesPendingFirst(items: readonly Purchase[]): Purchase[] {
  return [...items].sort(
    (a, b) => Number(a.paymentStatus === "paid") - Number(b.paymentStatus === "paid"),
  );
}

export function formatPurchaseItemsLine(
  items: Purchase["items"],
  visibleName: (name: string) => string,
): string {
  if (items.length === 0) return "";
  const parts = items.slice(0, 3).map((item) => {
    const name = visibleName(item.productName);
    return item.variationName
      ? `${item.quantity}x ${name} — ${item.variationName}`
      : `${item.quantity}x ${name}`;
  });
  if (items.length > 3) parts.push(`+${items.length - 3} itens`);
  return parts.join(" · ");
}
