import { formatCurrency } from "../../shared/utils/format";
import type { Material } from "@lucro-caseiro/contracts";

export type StockTone = "success" | "warn" | "danger";

export function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

/** Insumo abaixo (ou igual) ao limite de alerta definido. */
export function isLowStock(m: Material): boolean {
  return m.stockAlertThreshold != null && m.stockQuantity <= m.stockAlertThreshold;
}

/** Texto do estoque atual (ex.: "0,8 kg"). */
export function currentStockLabel(m: Material): string {
  return `${formatQty(m.stockQuantity)} ${m.unit}`;
}

/**
 * Badge do card: "Sem estoque" (zerado), "Baixo • {limite} {un}" (abaixo do
 * alerta — mostra a meta mínima) ou "{estoque} {un}" (ok).
 */
export function stockBadge(m: Material): { label: string; tone: StockTone } {
  if (m.stockQuantity <= 0) {
    return { label: "Sem estoque", tone: "danger" };
  }
  const threshold = m.stockAlertThreshold;
  if (threshold != null && m.stockQuantity <= threshold) {
    return { label: `Baixo • ${formatQty(threshold)} ${m.unit}`, tone: "warn" };
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
