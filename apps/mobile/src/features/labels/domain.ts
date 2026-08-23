import { DEFAULT_LABEL_LAYOUT, type Label } from "@lucro-caseiro/contracts";

import { displayIngredientName } from "../../shared/ingredient-image/resolve";

export const LABEL_LIST_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "recent", label: "Recentes" },
  { value: "mostUsed", label: "Mais usadas" },
] as const;

export type LabelListFilter = (typeof LABEL_LIST_FILTERS)[number]["value"];

export type LabelThumbnailShape = "circle" | "rounded" | "oval" | "scalloped";

const TEMPLATE_CATEGORY: Record<string, string> = {
  classico: "clássico",
  moderno: "moderno",
  minimalista: "minimalista",
  artesanal: "artesanal",
  gourmet: "gourmet",
};

/** Nome visível, sem prefixos técnicos como "[massa etiquetas]". */
export function displayLabelName(name: string): string {
  return displayIngredientName(name);
}

/** Categoria do produto vinculado; se não houver, usa o modelo visual. */
export function labelCategory(
  label: Label,
  categoryByProductId: ReadonlyMap<string, string>,
): string {
  if (label.productId) {
    const category = categoryByProductId.get(label.productId)?.trim();
    if (category) return displayIngredientName(category);
  }
  return TEMPLATE_CATEGORY[label.templateId] ?? label.templateId;
}

/**
 * Volume de impressão já persistido no formato da etiqueta.
 * O contrato não expõe contagem de uso; copiesPerSheet é a métrica local.
 */
export function labelUsageScore(label: Label): number {
  return label.data.layout?.copiesPerSheet ?? DEFAULT_LABEL_LAYOUT.copiesPerSheet;
}

/** Uma etiqueta só: a de maior volume; empate fica com a mais antiga. */
export function mostUsedLabelId(labels: readonly Label[]): string | null {
  if (labels.length === 0) return null;
  let winner = labels[0];
  for (const label of labels.slice(1)) {
    const usageDelta = labelUsageScore(label) - labelUsageScore(winner);
    if (usageDelta > 0) {
      winner = label;
      continue;
    }
    if (usageDelta === 0 && label.createdAt < winner.createdAt) winner = label;
  }
  return winner.id;
}

export function matchesLabelSearch(
  label: Label,
  query: string,
  categoryByProductId: ReadonlyMap<string, string>,
): boolean {
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  if (!needle) return true;
  const haystacks = [
    displayLabelName(label.name),
    label.name,
    label.data.productName,
    labelCategory(label, categoryByProductId),
    label.templateId,
  ];
  return haystacks.some((value) => value.toLocaleLowerCase("pt-BR").includes(needle));
}

export function sortLabels(labels: readonly Label[], filter: LabelListFilter): Label[] {
  const copy = [...labels];
  if (filter === "mostUsed") {
    return copy.sort((a, b) => {
      const usage = labelUsageScore(b) - labelUsageScore(a);
      if (usage !== 0) return usage;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }
  return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function visibleLabels(
  labels: readonly Label[],
  query: string,
  filter: LabelListFilter,
  categoryByProductId: ReadonlyMap<string, string>,
): Label[] {
  return sortLabels(
    labels.filter((label) => matchesLabelSearch(label, query, categoryByProductId)),
    filter,
  );
}

export function formatLabelEditedAt(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!year || !month || !day) return "";
  return `Editada em ${day}/${month}/${year}`;
}

export function labelThumbnailShape(templateId: string): LabelThumbnailShape {
  switch (templateId) {
    case "minimalista":
      return "circle";
    case "gourmet":
      return "oval";
    case "artesanal":
      return "scalloped";
    default:
      return "rounded";
  }
}

/** Largura do PNG oficial (~46–50% do painel), reduzida em telas estreitas. */
export function labelsHeroIllustrationWidth(panelWidth: number): number {
  let ratio = 0.48;
  if (panelWidth <= 328) ratio = 0.46;
  else if (panelWidth >= 398) ratio = 0.5;
  return Math.round(panelWidth * ratio);
}

/** Altura compacta do painel vinho; encolhe um pouco abaixo de 360px. */
export function labelsHeroPanelHeight(viewportWidth: number): number {
  return viewportWidth < 360 ? 148 : 160;
}
