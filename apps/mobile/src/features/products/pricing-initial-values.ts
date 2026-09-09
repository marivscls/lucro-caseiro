function routePrice(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function pricingProductInitialValues(params: {
  create?: string;
  salePrice?: string;
  costPrice?: string;
  name?: string;
  category?: string;
}) {
  if (params.create !== "from-pricing") return undefined;
  return {
    salePrice: routePrice(params.salePrice),
    costPrice: routePrice(params.costPrice),
    name: params.name,
    category: params.category,
  };
}
