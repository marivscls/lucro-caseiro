import { formatCurrency } from "../../shared/utils/format";
import type { Material } from "@lucro-caseiro/contracts";

export type StockTone = "success" | "warn" | "danger";
export type StockStatus = "low" | "attention" | "ok";

const WEIGHT_UNITS = new Set(["kg", "g", "mg"]);
const VOLUME_UNITS = new Set(["l", "ml"]);
const COUNT_UNITS = new Set(["un", "und", "unid", "unidade", "dz", "duzia"]);

export function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

/** Insumo abaixo (ou igual) ao limite de alerta definido. */
export function isLowStock(m: Material): boolean {
  return m.stockAlertThreshold != null && m.stockQuantity <= m.stockAlertThreshold;
}

/** Estado visual único da despensa, derivado do limite de alerta já persistido. */
export function getStockStatus(m: Material): StockStatus {
  const minimum = m.stockAlertThreshold;
  if (minimum == null) return "ok";
  if (m.stockQuantity <= minimum) return "low";
  if (minimum <= 0) return "ok";
  if (m.stockQuantity <= minimum * 1.2) return "attention";
  return "ok";
}

/** Preenchimento seguro da barra, limitado a 100% visual. */
export function stockLevelRatio(m: Material): number {
  const minimum = m.stockAlertThreshold;
  if (minimum == null || minimum <= 0) return 1;
  return Math.min(m.stockQuantity / minimum, 1.5) / 1.5;
}

/** O contrato ainda não persiste categoria; usamos a família real da unidade. */
export function materialCategory(m: Pick<Material, "unit">): string {
  const unit = m.unit.trim().toLowerCase();
  if (WEIGHT_UNITS.has(unit)) return "Peso";
  if (VOLUME_UNITS.has(unit)) return "Volume";
  if (COUNT_UNITS.has(unit)) return "Unidades";
  return m.unit.trim() || "Outros";
}

/** Valor atual em estoque conforme custo e quantidade na mesma unidade do material. */
export function materialStockValue(
  m: Pick<Material, "costPerUnit" | "stockQuantity">,
): number {
  return Math.max(0, m.stockQuantity) * Math.max(0, m.costPerUnit ?? 0);
}

/** Texto do estoque atual (ex.: "0,8 kg"). */
export function currentStockLabel(m: Material): string {
  return `${formatQty(m.stockQuantity)} ${m.unit}`;
}

/**
 * Badge do card: "Sem estoque" (zerado), "Baixo . {limite} {un}" (abaixo do
 * alerta - mostra a meta m�nima) ou "{estoque} {un}" (ok).
 */
export function stockBadge(m: Material): { label: string; tone: StockTone } {
  if (m.stockQuantity <= 0) {
    return { label: "Sem estoque", tone: "danger" };
  }
  const threshold = m.stockAlertThreshold;
  if (threshold != null && m.stockQuantity <= threshold) {
    return { label: `Baixo . ${formatQty(threshold)} ${m.unit}`, tone: "warn" };
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
            ? "n�o definido"
            : `${formatQty(material.stockAlertThreshold)} ${material.unit}`;
        return `. ${material.name} - atual: ${current} � m�nimo: ${minimum}`;
      }),
    ];
  }

  return [
    "?? Lista de compras de insumos",
    "",
    ...section("SEM ESTOQUE", outOfStock),
    ...(outOfStock.length > 0 && lowStock.length > 0 ? [""] : []),
    ...section("ESTOQUE BAIXO", lowStock),
  ].join("\n");
}

/** Separa a lista de compra pela urg�ncia sem misturar produtos acabados. */
export function groupShoppingListItems(items: Material[]): {
  outOfStock: Material[];
  lowStock: Material[];
} {
  return {
    outOfStock: items.filter((material) => material.stockQuantity <= 0),
    lowStock: items.filter((material) => material.stockQuantity > 0),
  };
}
