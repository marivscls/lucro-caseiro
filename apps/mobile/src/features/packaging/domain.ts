import { formatCurrency } from "../../shared/utils/format";
import { displayIngredientName } from "../../shared/ingredient-image/resolve";
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

/** Chips sempre visíveis na lista (ordem da referência). Filmes permanece nesta fileira. */
export const PACKAGING_LIST_FILTERS: readonly {
  value: PackagingTypeValue | null;
  label: string;
}[] = [
  { value: null, label: "Todas" },
  { value: "box", label: "Caixas" },
  { value: "pot", label: "Potes" },
  { value: "bag", label: "Sacolas" },
  { value: "film", label: "Filmes" },
];

/** Tipos extras abertos pelo botão Filtros (não entram na fileira principal). */
export const PACKAGING_EXTRA_FILTERS: readonly {
  value: PackagingTypeValue;
  label: string;
}[] = [
  { value: "label", label: "Rótulo" },
  { value: "other", label: "Outro" },
];

/** Faixas laterais dessaturadas — não competem com a paleta vinho/rosa/lima. */
const TYPE_STRIPE: Record<string, string> = {
  box: "#8FA0AE",
  pot: "#C4B4D4",
  bag: "#D2B48C",
  film: "#9BB89A",
  label: "#C4A8B0",
  other: "#B0A8A4",
};

/** Fundo claro da miniatura circular, alinhado à faixa da categoria. */
const TYPE_SURFACE: Record<string, string> = {
  box: "#D9E1E6",
  pot: "#E8DFF0",
  bag: "#F0E4CC",
  film: "#DCE8DA",
  label: "#EBDDE1",
  other: "#E6E2DE",
};

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

/**
 * Estoque baixo: o contrato de embalagem não persiste quantidade nem mínimo.
 * Mantém a lógica atual (nada classificado) até o backend expor esse dado.
 */
export function isLowStock(_packaging: Packaging): boolean {
  return false;
}

/** Quantidade de embalagens já classificadas como estoque baixo. */
export function restockCount(items: readonly Packaging[]): number {
  return items.filter(isLowStock).length;
}

/** Faixa vertical do card (cor auxiliar por categoria). */
export function typeStripeColor(type: string): string {
  return TYPE_STRIPE[type] ?? TYPE_STRIPE.other;
}

/** Fundo da miniatura quando não há foto. */
export function typeSurfaceColor(type: string): string {
  return TYPE_SURFACE[type] ?? TYPE_SURFACE.other;
}

/** Slug único por nome visível — evita a mesma miniatura para produtos diferentes. */
export function packagingIllustrationSlug(name: string): string {
  const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
  return displayIngredientName(name)
    .normalize("NFD")
    .replace(ACCENTS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join("-");
}

/** Largura do PNG oficial (~48–52% do painel), reduzida em telas estreitas. */
export function packagingHeroIllustrationWidth(panelWidth: number): number {
  let ratio = 0.5;
  if (panelWidth <= 328) ratio = 0.48;
  else if (panelWidth >= 398) ratio = 0.52;
  return Math.round(panelWidth * ratio);
}

/** Altura do painel vinho; encolhe um pouco abaixo de 360px. */
export function packagingHeroPanelHeight(viewportWidth: number): number {
  return viewportWidth < 360 ? 196 : 210;
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
