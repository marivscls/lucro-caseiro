import {
  CreatePricingDto,
  finalPriceWithFees,
  overheadPercent,
  revenueCosting,
  suggestedPrice,
  type CreatePricing,
  type Pricing,
  type Product,
  type Recipe,
  type Packaging,
} from "@lucro-caseiro/contracts";

/** Keep the same persisted net-price semantics as the API. */
export function pricingQuote(input: CreatePricing) {
  const data = CreatePricingDto.parse(input);
  const direct = data.ingredientCost + data.packagingCost + data.laborCost;
  let cost = direct + data.fixedCostShare;
  let base = suggestedPrice(cost, data.marginPercent);
  let overhead = data.fixedCostShare;
  if (data.allocationMode === "revenue") {
    const result = revenueCosting(
      direct,
      data.marginPercent,
      overheadPercent(data.monthlyFixedCosts ?? 0, data.revenueBasis ?? 0),
      data.feesPercent ?? 0,
    );
    cost = result.totalCost;
    base = result.suggestedPrice;
    overhead = result.overheadAmount;
  }
  return {
    totalCost: cost,
    suggestedPrice: base,
    overhead,
    ...finalPriceWithFees(base, data.feesPercent ?? 0),
  };
}

export function evaluateSalePrice(input: CreatePricing, price: number) {
  CreatePricingDto.parse(input);
  if (!Number.isFinite(price) || price < 0)
    throw new RangeError("Informe um preço válido");
  const fees = (price * (input.feesPercent ?? 0)) / 100;
  const overhead =
    input.allocationMode === "revenue"
      ? (price * (input.monthlyFixedCosts ?? 0)) / (input.revenueBasis ?? 1)
      : input.fixedCostShare;
  const cost = input.ingredientCost + input.packagingCost + input.laborCost + overhead;
  const profit = price - fees - cost;
  return { profit, margin: price > 0 ? (profit / price) * 100 : 0, overhead, fees, cost };
}

type CostProduct = Pick<
  Product,
  "id" | "name" | "recipeId" | "costPrice" | "isComposite" | "components"
>;
type CostRecipe = Pick<Recipe, "id" | "costPerUnit">;
type CostPackaging = Pick<Packaging, "id" | "unitCost">;
type SavedCost = Pick<
  Pricing,
  | "id"
  | "productId"
  | "ingredientCost"
  | "packagingCost"
  | "channelName"
  | "sourceSnapshot"
  | "createdAt"
>;

export function currentProductCost(
  product: CostProduct,
  products: CostProduct[],
  recipes: CostRecipe[],
): number | null {
  if (product.isComposite) {
    let total = 0;
    for (const component of product.components ?? []) {
      const child = products.find((item) => item.id === component.componentProductId);
      if (!child || child.isComposite) return null;
      const cost = currentProductCost(child, [], recipes);
      if (cost == null) return null;
      total += cost * component.quantity;
    }
    return total;
  }
  if (product.recipeId)
    return recipes.find((recipe) => recipe.id === product.recipeId)?.costPerUnit ?? null;
  return product.costPrice;
}

export function pricingReviews<T extends SavedCost>(
  calculations: T[],
  products: CostProduct[],
  recipes: CostRecipe[],
  packaging: CostPackaging[],
) {
  const latest = new Map<string, T>();
  for (const saved of calculations) {
    if (!saved.productId) continue;
    const key = `${saved.productId}:${saved.channelName ?? ""}`;
    const previous = latest.get(key);
    if (!previous || saved.createdAt > previous.createdAt) latest.set(key, saved);
  }
  const reviews: Array<{
    product: CostProduct;
    calculation: T;
    increasedBy: number;
    missingSource: boolean;
  }> = [];
  for (const saved of latest.values()) {
    const product = products.find((item) => item.id === saved.productId);
    const source = saved.sourceSnapshot;
    if (!source || !product) continue;
    let increasedBy = 0;
    let missingSource = false;
    if (source.ingredientSource !== "manual") {
      const current =
        source.ingredientSource === "recipe"
          ? recipes.find((recipe) => recipe.id === source.recipeId)?.costPerUnit
          : currentProductCost(product, products, recipes);
      if (current == null) missingSource = true;
      else increasedBy += Math.max(0, current - saved.ingredientCost);
    }
    for (const item of source.packaging) {
      const current = packaging.find((pack) => pack.id === item.id);
      if (!current) missingSource = true;
      else increasedBy += Math.max(0, current.unitCost - item.unitCost);
    }
    // Ignore sub-cent rounding differences from persisted numeric(10,2) values.
    if (increasedBy >= 0.005 || missingSource)
      reviews.push({ product, calculation: saved, increasedBy, missingSource });
  }
  return reviews;
}
