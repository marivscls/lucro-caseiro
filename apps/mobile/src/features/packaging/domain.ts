import { formatCurrency } from "../../shared/utils/format";
import type { Packaging } from "@lucro-caseiro/contracts";
import type { Theme } from "@lucro-caseiro/ui";

export type PackagingTypeValue = "box" | "bag" | "pot" | "film" | "label" | "other";

export const PACKAGING_TYPES: readonly { value: PackagingTypeValue; label: string }[] = [
  { value: "box", label: "Caixa" },
  { value: "bag", label: "Sacola" },
  { value: "pot", label: "Pote" },
  { value: "film", label: "Filme" },
  { value: "label", label: "Rótulo" },
  { value: "other", label: "Outro" },
];

/** Rótulo amigável do tipo (ex.: "box" -> "Caixa"). */
export function typeLabel(type: string): string {
  return PACKAGING_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** Emoji de fallback do avatar quando não há foto da embalagem. */
export function typeEmoji(type: string): string {
  switch (type) {
    case "box":
      return "📦";
    case "bag":
      return "🛍️";
    case "pot":
      return "🥡";
    case "film":
      return "🎞️";
    case "label":
      return "🏷️";
    default:
      return "📦";
  }
}

/** Cor de destaque do tipo (badge/avatar), derivada do tema. */
export function typeColor(theme: Theme, type: string): string {
  switch (type) {
    case "box":
      return theme.colors.blue;
    case "bag":
      return theme.colors.premium;
    case "pot":
      return theme.colors.lavender;
    case "film":
      return theme.colors.success;
    case "label":
      return theme.colors.premium;
    default:
      return theme.colors.textSecondary;
  }
}

/** Soma do custo unitário de todas as embalagens (valor investido em estoque). */
export function totalStockCost(items: readonly Packaging[]): number {
  return items.reduce((sum, p) => sum + p.unitCost, 0);
}

/** Texto pronto p/ compartilhar os dados de uma embalagem. */
export function buildPackagingShareText(p: Packaging): string {
  const lines = [
    `📦 ${p.name}`,
    `Tipo: ${typeLabel(p.type)}`,
    `Custo unitário: ${formatCurrency(p.unitCost)}`,
  ];
  if (p.supplier) lines.push(`Fornecedor: ${p.supplier}`);
  return lines.join("\n");
}
