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
  const { outOfStock, lowStock } = groupShoppingListItems(items);

  function section(title: string, sectionItems: Material[]): string[] {
    if (sectionItems.length === 0) return [];
    return [
      title,
      ...sectionItems.map((material) => {
        const current = `${formatQty(material.stockQuantity)} ${material.unit}`;
        const minimum =
          material.stockAlertThreshold == null
            ? "não definido"
            : `${formatQty(material.stockAlertThreshold)} ${material.unit}`;
        return `• ${material.name} — atual: ${current} · mínimo: ${minimum}`;
      }),
    ];
  }

  return [
    "🛒 Lista de compras de insumos",
    "",
    ...section("SEM ESTOQUE", outOfStock),
    ...(outOfStock.length > 0 && lowStock.length > 0 ? [""] : []),
    ...section("ESTOQUE BAIXO", lowStock),
  ].join("\n");
}

/** Separa a lista de compra pela urgência sem misturar produtos acabados. */
export function groupShoppingListItems(items: Material[]): {
  outOfStock: Material[];
  lowStock: Material[];
} {
  return {
    outOfStock: items.filter((material) => material.stockQuantity <= 0),
    lowStock: items.filter((material) => material.stockQuantity > 0),
  };
}
