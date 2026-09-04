import type { Insights, MonthlyRevenue } from "@lucro-caseiro/contracts";

import { formatIntBR } from "../../shared/utils/format";
import { displayProductName } from "../products/display";

export { formatCurrency as formatMoney } from "../../shared/utils/format";

/** Versão curta para eixos/labels (sem centavos). Ex.: "R$ 1.200", "R$ 15,5 mil". */
export function formatMoneyShort(value: number): string {
  if (value >= 10_000) {
    return `R$ ${(value / 1000).toFixed(1).replace(".", ",")} mil`;
  }
  return `R$ ${formatIntBR(value)}`;
}

const MONTH_ABBR = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "2026-05" -> "mai". */
export function monthLabel(key: string): string {
  const month = Number(key.split("-")[1]);
  return MONTH_ABBR[month - 1] ?? key;
}

/** Variação % do último mês vs o anterior; null quando não dá pra comparar. */
export function monthOverMonthDelta(series: MonthlyRevenue[]): number | null {
  if (series.length < 2) return null;
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  if (!current || !previous || previous.revenue <= 0) return null;
  return ((current.revenue - previous.revenue) / previous.revenue) * 100;
}

/** Maior receita da série (>= 1 para evitar divisão por zero ao calcular alturas). */
export function maxRevenue(series: MonthlyRevenue[]): number {
  return Math.max(1, ...series.map((m) => m.revenue));
}

export type InsightActionTarget = "finance" | "products" | "sales" | "clients";

export interface ActionableInsight {
  id: string;
  title: string;
  description: string;
  target: InsightActionTarget;
  tone: "attention" | "opportunity" | "ok";
}

interface InsightProduct {
  id: string;
  name?: string;
  salePrice: number;
  costPrice: number | null;
  saleUnit: string;
  isComposite: boolean;
  stockQuantity: number | null;
  stockAlertThreshold: number | null;
  variations?: Array<{ stockQuantity?: number }>;
}

function isLowStock(product: InsightProduct): boolean {
  if (product.saleUnit !== "unit" || product.isComposite) return false;
  if (product.variations && product.variations.length > 0) {
    return product.variations.some(
      (variation) =>
        variation.stockQuantity !== undefined &&
        product.stockAlertThreshold !== null &&
        variation.stockQuantity <= product.stockAlertThreshold,
    );
  }
  return (
    product.stockQuantity !== null &&
    product.stockAlertThreshold !== null &&
    product.stockQuantity <= product.stockAlertThreshold
  );
}

/** Recomendações transparentes: cada regra explicita o dado/limite que a disparou. */
export function buildActionableInsights(
  data: Insights,
  products: InsightProduct[],
): ActionableInsight[] {
  const actions: ActionableInsight[] = [];
  const delta = monthOverMonthDelta(data.monthlyRevenue);
  if (delta !== null && delta < 0) {
    actions.push({
      id: "revenue-drop",
      title: `Faturamento caiu ${Math.abs(delta).toFixed(0)}%`,
      description: "Compare entradas e saídas antes de decidir o próximo passo.",
      target: "finance",
      tone: "attention",
    });
  }

  const lowStockCount = products.filter(isLowStock).length;
  if (lowStockCount > 0) {
    actions.push({
      id: "low-stock",
      title: `${lowStockCount} ${lowStockCount === 1 ? "produto precisa" : "produtos precisam"} de reposição`,
      description: "Confira o estoque baixo antes da próxima venda.",
      target: "products",
      tone: "attention",
    });
  }

  const soldProductIds = new Set(data.topProducts.map((product) => product.productId));
  const lowMarginSellers = products.filter((product) => {
    if (!soldProductIds.has(product.id)) return false;
    if (product.costPrice === null || product.salePrice <= 0) return false;
    return (product.salePrice - product.costPrice) / product.salePrice < 0.2;
  });
  if (lowMarginSellers.length > 0) {
    actions.push({
      id: "low-margin",
      title: `${lowMarginSellers.length} ${
        lowMarginSellers.length === 1
          ? "produto vendido deixa"
          : "produtos vendidos deixam"
      } menos de 20% do preço`,
      description: "Eles aparecem entre os mais vendidos; revise o preço ou o custo.",
      target: "products",
      tone: "attention",
    });
  }

  if (actions.length === 0 && data.topProducts[0]) {
    actions.push({
      id: "top-product",
      title: `${displayProductName(data.topProducts[0].name)} lidera suas vendas`,
      description: "Use esse destaque para registrar a próxima venda.",
      target: "sales",
      tone: "opportunity",
    });
  }
  if (actions.length < 3 && data.topClients[0]) {
    actions.push({
      id: "top-client",
      title: `${data.topClients[0].name} é seu cliente de maior valor`,
      description: "Abra o cadastro para acompanhar o histórico.",
      target: "clients",
      tone: "opportunity",
    });
  }

  return actions.slice(0, 3);
}

export type InsightQuestionId = "restock" | "margin";

export function answerInsightQuestion(
  question: InsightQuestionId,
  data: Insights,
  products: InsightProduct[],
): string {
  if (question === "restock") {
    const names = products
      .filter(isLowStock)
      .map((product) => product.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 3);
    if (names.length === 0) {
      return "Nenhum produto com controle ativo está abaixo do limite de estoque.";
    }
    return `Priorize ${names.join(", ")}. Eles já atingiram o limite de reposição cadastrado.`;
  }

  const soldProductIds = new Set(data.topProducts.map((product) => product.productId));
  const lowMargin = products
    .filter((product) => {
      if (!soldProductIds.has(product.id)) return false;
      if (product.costPrice === null || product.salePrice <= 0) return false;
      return (product.salePrice - product.costPrice) / product.salePrice < 0.2;
    })
    .map((product) => product.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);
  if (lowMargin.length === 0) {
    return "Não há produto vendido com custo informado e margem abaixo de 20% neste período.";
  }
  return `${lowMargin.join(", ")} ${lowMargin.length === 1 ? "está" : "estão"} abaixo de 20% de margem. Revise custo ou preço.`;
}
