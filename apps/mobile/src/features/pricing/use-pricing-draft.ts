import { useMemo, useCallback } from "react";
import { create } from "zustand";
import { MAX_MONEY } from "@lucro-caseiro/contracts";
import type {
  CreatePricing,
  Pricing,
  PricingSourceSnapshot,
  Product,
  Recipe,
  Packaging,
} from "@lucro-caseiro/contracts";
import { currencyInput, parseCurrencyInput } from "../../shared/utils/currency-input";
import { currentProductCost, pricingQuote, profitMarkupPercent } from "./calc";

export interface PricingDraft {
  alternative: string;
  productId: string;
  ingredient: string;
  packaging: string;
  labor: string;
  fixed: string;
  production: string;
  revenue: string;
  allocation: "unit" | "revenue";
  profit: string;
  profitMode: "money" | "markup";
  fees: string;
  channelName: string;
  source: PricingSourceSnapshot["ingredientSource"];
  recipeId?: string;
  packagingIds: string[];
}
const emptyDraft: PricingDraft = {
  alternative: "",
  productId: "",
  ingredient: "",
  packaging: "",
  labor: "",
  fixed: "",
  production: "",
  revenue: "",
  allocation: "unit",
  profit: "",
  profitMode: "money",
  fees: "",
  channelName: "",
  source: "manual",
  packagingIds: [],
};
export const decimalValue = (text: string) =>
  text.trim() ? Number(text.replace(",", ".")) : 0;
export const moneyValue = (text: string) => (text.trim() ? parseCurrencyInput(text) : 0);

// In-memory only. A distinct account/import key never sees another draft.
const useDraftSession = create<{ key: string | null; draft: PricingDraft | null }>(
  () => ({ key: null, draft: null }),
);

export function usePricingDraft(initialCost?: number, sessionKey = "pricing") {
  const initial = useMemo<PricingDraft>(
    () => ({
      ...emptyDraft,
      ingredient:
        initialCost != null && Number.isFinite(initialCost) && initialCost > 0
          ? currencyInput(initialCost)
          : "",
    }),
    [initialCost],
  );
  const session = useDraftSession();
  const hasSession = session.key === sessionKey && session.draft != null;
  const draft = hasSession ? session.draft! : initial;
  const update = useCallback(
    (patch: Partial<PricingDraft>) =>
      useDraftSession.setState((current) => ({
        key: sessionKey,
        draft: {
          ...(current.key === sessionKey ? (current.draft ?? initial) : initial),
          ...patch,
        },
      })),
    [sessionKey, initial],
  );
  return { draft, update, hasSession, reset: () => update({ ...emptyDraft }) };
}

export function draftForProduct(
  product: Product,
  products: Product[],
  recipes: Recipe[],
  packaging: Packaging[],
  saved?: Pricing,
): PricingDraft {
  const snapshot = saved?.sourceSnapshot;
  let source: PricingDraft["source"] = product.recipeId ? "recipe" : "product";
  if (saved) source = snapshot?.ingredientSource ?? "manual";
  const recipeId = snapshot?.recipeId ?? product.recipeId ?? undefined;
  let cost = currentProductCost(product, products, recipes);
  if (source === "manual") cost = saved?.ingredientCost ?? cost;
  if (source === "recipe")
    cost = recipes.find((item) => item.id === recipeId)?.costPerUnit ?? null;
  const selected = snapshot?.packaging ?? [];
  const confirmed = snapshot?.confirmed;
  const fixed = snapshot?.monthlyFixed ?? saved?.monthlyFixedCosts ?? 0;
  const packagingCost = selected.length
    ? selected.reduce(
        (sum, item) =>
          sum + (packaging.find((p) => p.id === item.id)?.unitCost ?? item.unitCost),
        0,
      )
    : saved?.packagingCost;
  return {
    ...emptyDraft,
    productId: product.id,
    source,
    recipeId,
    ingredient: cost == null ? "" : currencyInput(cost),
    packaging:
      packagingCost != null && (packagingCost > 0 || confirmed?.packaging)
        ? currencyInput(packagingCost)
        : "",
    packagingIds: selected.map((item) => item.id),
    labor:
      saved && (saved.laborCost > 0 || confirmed?.labor)
        ? currencyInput(saved.laborCost)
        : "",
    fixed: fixed > 0 || confirmed?.fixed ? currencyInput(fixed) : "",
    production: snapshot?.monthlyProduction ? String(snapshot.monthlyProduction) : "",
    revenue: saved?.revenueBasis ? currencyInput(saved.revenueBasis) : "",
    allocation: saved?.allocationMode ?? "unit",
    profit: saved ? String(saved.marginPercent).replace(".", ",") : "",
    profitMode: saved ? "markup" : "money",
    fees:
      saved && (saved.feesPercent > 0 || confirmed?.fees)
        ? String(saved.feesPercent).replace(".", ",")
        : "",
    channelName: saved?.channelName ?? "",
  };
}

export function draftCalculation(draft: PricingDraft, packaging: Packaging[]) {
  const ingredientCost = moneyValue(draft.ingredient);
  const packagingCost = moneyValue(draft.packaging);
  const laborCost = moneyValue(draft.labor);
  const monthlyFixed = moneyValue(draft.fixed);
  const production = decimalValue(draft.production);
  if (!Number.isFinite(ingredientCost) || ingredientCost <= 0)
    return { error: "Informe o custo por unidade para calcular." };
  if (draft.packagingIds.some((id) => !packaging.some((item) => item.id === id)))
    return {
      error: "Uma embalagem foi excluída. Escolha outra ou informe o custo manualmente.",
    };
  if (
    monthlyFixed > 0 &&
    draft.allocation === "unit" &&
    (!Number.isFinite(production) || production <= 0)
  )
    return { error: "Informe a produção mensal para dividir as despesas." };
  if (!draft.profit.trim())
    return { error: "Informe o ganho desejado. Use 0 para simular sem ganho." };
  const fixedCostShare =
    draft.allocation === "unit" && production > 0 ? monthlyFixed / production : 0;
  const profitBasis = ingredientCost + packagingCost + laborCost + fixedCostShare;
  const marginPercent =
    draft.profitMode === "money"
      ? profitMarkupPercent(profitBasis, moneyValue(draft.profit))
      : decimalValue(draft.profit);
  const input: CreatePricing = {
    productId: draft.productId || undefined,
    ingredientCost,
    packagingCost,
    laborCost,
    fixedCostShare,
    marginPercent,
    feesPercent: decimalValue(draft.fees),
    allocationMode: draft.allocation,
    monthlyFixedCosts: draft.allocation === "revenue" ? monthlyFixed : undefined,
    revenueBasis: draft.allocation === "revenue" ? moneyValue(draft.revenue) : undefined,
    channelName: draft.channelName || undefined,
    sourceSnapshot: {
      confirmed: {
        packaging: !!draft.packaging.trim(),
        labor: !!draft.labor.trim(),
        fixed: !!draft.fixed.trim(),
        fees: !!draft.fees.trim(),
      },
      ingredientSource: draft.source,
      recipeId: draft.source === "recipe" ? draft.recipeId : undefined,
      packaging: draft.packagingIds.map((id) => ({
        id,
        unitCost: packaging.find((item) => item.id === id)!.unitCost,
      })),
      monthlyProduction: production,
      monthlyFixed,
    },
  };
  try {
    const quote = pricingQuote(input);
    if (!Number.isFinite(quote.finalPrice) || quote.finalPrice > MAX_MONEY)
      return { error: "Preço muito alto. Revise custos, ganho e taxas." };
    return { input, quote };
  } catch {
    return {
      error:
        "Confira os valores: taxas + despesas por faturamento devem somar menos de 100%, as despesas devem ficar abaixo de 95%, e o acréscimo deve ficar entre 0% e 1.000%.",
    };
  }
}

export type PricingStep = 1 | 2 | 3;

/** Validate only decisions already presented, using the existing calculation rules. */
export function pricingStepError(
  step: PricingStep,
  draft: PricingDraft,
  packaging: Packaging[],
  sourceError?: string,
): string | undefined {
  if (sourceError) return sourceError;
  const scoped = { ...draft };
  if (step < 3) scoped.profit = "0";
  if (step === 1) {
    scoped.labor = "0";
    scoped.fixed = "0";
    scoped.production = "";
    scoped.revenue = "";
    scoped.allocation = "unit";
    scoped.fees = "0";
  }
  return draftCalculation(scoped, packaging).error;
}

export function firstInvalidPricingStep(
  draft: PricingDraft,
  packaging: Packaging[],
  sourceError?: string,
): PricingStep | null {
  for (const step of [1, 2, 3] as const) {
    if (pricingStepError(step, draft, packaging, sourceError)) return step;
  }
  return null;
}
