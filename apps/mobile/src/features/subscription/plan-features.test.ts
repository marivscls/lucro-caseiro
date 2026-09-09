import { hasActiveFeature, type PlanFeature } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

const PROFESSIONAL_ONLY: readonly PlanFeature[] = [
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
  it("allows the product gallery in essential while respecting subscription expiry", () => {
    expect(hasActiveFeature("free", null, "extraPhotos")).toBe(false);
    expect(hasActiveFeature("essential", null, "extraPhotos")).toBe(true);
    expect(hasActiveFeature("professional", null, "extraPhotos")).toBe(true);
    expect(hasActiveFeature("essential", "2020-01-01T00:00:00Z", "extraPhotos")).toBe(
      false,
    );
  });

  it("keeps the basic monthly PDF available in essential", () => {
    expect(hasActiveFeature("free", null, "exportBasic")).toBe(false);
    expect(hasActiveFeature("essential", null, "exportBasic")).toBe(true);
    expect(hasActiveFeature("professional", null, "exportBasic")).toBe(true);
  });

  it("keeps the complete and customizable catalog available in essential", () => {
    expect(hasActiveFeature("free", null, "catalogPremium")).toBe(false);
    expect(hasActiveFeature("free", null, "catalogCustomization")).toBe(false);
    expect(hasActiveFeature("essential", null, "catalogPremium")).toBe(true);
    expect(hasActiveFeature("essential", null, "catalogCustomization")).toBe(true);
    expect(hasActiveFeature("professional", null, "catalogPremium")).toBe(true);
    expect(hasActiveFeature("professional", null, "catalogCustomization")).toBe(true);
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
