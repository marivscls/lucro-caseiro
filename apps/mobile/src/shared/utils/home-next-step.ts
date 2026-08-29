export type HomeNextStep = "register-product" | "price-product" | null;

export function resolveHomeNextStep(input: {
  settled: boolean;
  hasProduct: boolean;
  hasPriced: boolean;
  pricingKnown: boolean;
  gettingStartedVisible: boolean;
}): HomeNextStep {
  if (!input.settled) return null;
  if (!input.hasProduct) return "register-product";
  if (input.gettingStartedVisible) return null;
  if (input.pricingKnown && !input.hasPriced) return "price-product";
  return null;
}
