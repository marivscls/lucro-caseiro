import { describe, expect, it } from "vitest";

import { getPaywallRecommendedTier } from "./limit-copy";

describe("paywall recommended tier", () => {
  it("routes volume upgrades to essential", () => {
    expect(getPaywallRecommendedTier("sales")).toBe("essential");
    expect(getPaywallRecommendedTier("products")).toBe("essential");
  });

  it("routes professional features to professional", () => {
    expect(getPaywallRecommendedTier("reports")).toBe("professional");
    expect(getPaywallRecommendedTier("recurring")).toBe("professional");
    expect(getPaywallRecommendedTier("birthdays")).toBe("professional");
    expect(getPaywallRecommendedTier("suppliers")).toBe("professional");
  });
});
