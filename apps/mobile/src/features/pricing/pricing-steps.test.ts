import { describe, expect, it } from "vitest";
import * as pricing from "./use-pricing-draft";
import type { PricingDraft } from "./use-pricing-draft";

const draft = (patch: Partial<PricingDraft> = {}): PricingDraft => ({
  alternative: "",
  productId: "",
  ingredient: "10,00",
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
  ...patch,
});

describe("pricing step validation", () => {
  it("provides validation scoped to the current step", () => {
    expect(pricing.pricingStepError).toBeTypeOf("function");
  });
  it("lets costs advance before profit and production are filled", () => {
    expect(pricing.pricingStepError(1, draft({ fixed: "100" }), [])).toBeUndefined();
  });
  it("requires a valid unit cost in the first step", () => {
    expect(pricing.pricingStepError(1, draft({ ingredient: "" }), [])).toBeTruthy();
  });
  it("blocks a missing packaging source and changed costs", () => {
    expect(
      pricing.pricingStepError(1, draft({ packagingIds: ["deleted"] }), []),
    ).toBeTruthy();
    expect(pricing.pricingStepError(1, draft(), [], "Atualize os custos")).toBe(
      "Atualize os custos",
    );
  });
  it("allows optional expenses without silently changing the draft", () => {
    const input = draft();
    expect(pricing.pricingStepError(2, input, [])).toBeUndefined();
    expect(input.labor).toBe("");
    expect(input.fees).toBe("");
    expect(input.profit).toBe("");
  });
  it("blocks expenses that cannot be allocated", () => {
    expect(
      pricing.pricingStepError(2, draft({ fixed: "100", production: "0" }), []),
    ).toBeTruthy();
    expect(pricing.pricingStepError(2, draft({ fees: "100" }), [])).toBeTruthy();
  });
  it("requires profit only in the result step, accepting explicit zero", () => {
    expect(pricing.pricingStepError(3, draft(), [])).toBeTruthy();
    expect(pricing.pricingStepError(3, draft({ profit: "0" }), [])).toBeUndefined();
  });
  it("routes final validation to the earliest incomplete step", () => {
    expect(pricing.firstInvalidPricingStep(draft({ ingredient: "" }), [])).toBe(1);
    expect(pricing.firstInvalidPricingStep(draft({ fixed: "100" }), [])).toBe(2);
    expect(pricing.firstInvalidPricingStep(draft(), [])).toBe(3);
    expect(pricing.firstInvalidPricingStep(draft({ profit: "5" }), [])).toBeNull();
  });
});
