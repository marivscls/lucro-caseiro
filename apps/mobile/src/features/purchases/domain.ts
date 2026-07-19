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

/** Mantém contas a pagar no topo sem alterar a ordem dentro de cada grupo. */
export function sortPurchasesPendingFirst(items: readonly Purchase[]): Purchase[] {
  return [...items].sort(
    (a, b) => Number(a.paymentStatus === "paid") - Number(b.paymentStatus === "paid"),
  );
}
