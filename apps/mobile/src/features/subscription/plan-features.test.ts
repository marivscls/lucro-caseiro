import { hasActiveFeature, type PlanFeature } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

const PROFESSIONAL_ONLY: readonly PlanFeature[] = [
  "extraPhotos",
  "catalogPremium",
  "catalogCustomization",
  "advancedReports",
  "advancedPricing",
  "export",
  "purchases",
  "recurringExpenses",
  "labelsPremium",
  "quotesPdf",
  "premiumNotifications",
  "prioritySupport",
  "compositeProducts",
];

describe("plan feature matrix", () => {
  it("keeps the basic monthly PDF available in essential", () => {
    expect(hasActiveFeature("free", null, "exportBasic")).toBe(false);
    expect(hasActiveFeature("essential", null, "exportBasic")).toBe(true);
    expect(hasActiveFeature("professional", null, "exportBasic")).toBe(true);
  });

  it("treats the legacy premium value as professional", () => {
    expect(hasActiveFeature("premium", null, "catalogPremium")).toBe(true);
    expect(hasActiveFeature("premium", null, "catalogCustomization")).toBe(true);
  });

  it.each(PROFESSIONAL_ONLY)("keeps %s exclusive to professional", (feature) => {
    expect(hasActiveFeature("free", null, feature)).toBe(false);
    expect(hasActiveFeature("essential", null, feature)).toBe(false);
    expect(hasActiveFeature("professional", null, feature)).toBe(true);
  });
});
