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
    return { label: "Estoque baixo", tone: "warn" };
  }
  return { label: `${formatQty(m.stockQuantity)} ${m.unit}`, tone: "success" };
}

export function formatCost(value: number, unit: string): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}/${unit}`;
}
