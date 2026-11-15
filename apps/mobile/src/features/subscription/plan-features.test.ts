import { hasActiveFeature, type PlanFeature } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

// Recursos que antes eram só do Profissional e agora fazem parte do Premium.
const PREMIUM_ONLY: readonly PlanFeature[] = [
  "advancedReports",
  "advancedPricing",
  "export",
  "purchases",
  "recurringExpenses",
  "labelsPremium",
  "prioritySupport",
  "compositeProducts",
  // 2026-11-15: PDFs, fiado e histórico do financeiro saíram do Gratuito.
  "exportBasic",
  "quotesPdf",
  "fiado",
  "financeHistory",
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

  it.each(["premiumNotifications"] as const)(
    "releases %s on every plan, including free",
    (feature) => {
      expect(hasActiveFeature("free", null, feature)).toBe(true);
      expect(hasActiveFeature("essential", null, feature)).toBe(true);
      expect(hasActiveFeature("professional", null, feature)).toBe(true);
      expect(hasActiveFeature("essential", "2020-01-01T00:00:00Z", feature)).toBe(true);
    },
  );

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

  // Um plano pago só (Premium): os dois níveis gravados no banco liberam tudo,
  // inclusive o teste grátis (gravado como "essential").
  it.each(PREMIUM_ONLY)("unlocks %s on both paid tiers but not on free", (feature) => {
    expect(hasActiveFeature("free", null, feature)).toBe(false);
    expect(hasActiveFeature("essential", null, feature)).toBe(true);
    expect(hasActiveFeature("professional", null, feature)).toBe(true);
    expect(hasActiveFeature("essential", "2020-01-01T00:00:00Z", feature)).toBe(false);
  });
});
