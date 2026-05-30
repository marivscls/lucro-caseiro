import { formatCurrency } from "../../shared/utils/format";
import type { Material } from "@lucro-caseiro/contracts";

export type StockTone = "success" | "warn" | "danger";

export function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

export function stockBadge(m: Material): { label: string; tone: StockTone } {
  if (m.stockQuantity <= 0) {
    return { label: "Sem estoque", tone: "danger" };
  }
  if (m.stockAlertThreshold != null && m.stockQuantity <= m.stockAlertThreshold) {
    return {
      label: `Baixo · ${formatQty(m.stockQuantity)} ${m.unit}`,
      tone: "warn",
    };
  }
  return { label: `${formatQty(m.stockQuantity)} ${m.unit}`, tone: "success" };
}

export function formatCost(value: number, unit: string): string {
  return `${formatCurrency(value)}/${unit}`;
}

/** Monta uma lista de compras (texto pronto p/ compartilhar) a partir de insumos baixos/zerados. */
export function buildShoppingList(items: Material[]): string {
  const lines = items.map((m) => {
    const status =
      m.stockQuantity <= 0 ? "acabou" : `tem ${formatQty(m.stockQuantity)} ${m.unit}`;
    return `• ${m.name} (${status})`;
  });
  return `🛒 Lista de compras\n\n${lines.join("\n")}`;
}
