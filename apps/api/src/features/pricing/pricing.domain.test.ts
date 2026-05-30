import { describe, expect, it } from "vitest";

import {
  calculatePriceWithFees,
  calculateProfitPerUnit,
  calculateSuggestedPrice,
  calculateTotalCost,
  validatePricingData,
} from "./pricing.domain";

describe("calculateTotalCost", () => {
  it("sums all cost components", () => {
    const result = calculateTotalCost(10, 5, 3, 2);
    expect(result).toBe(20);
  });

  it("returns 0 when all costs are zero", () => {
    const result = calculateTotalCost(0, 0, 0, 0);
    expect(result).toBe(0);
  });

  it("handles decimal values", () => {
    const result = calculateTotalCost(10.5, 5.25, 3.1, 2.15);
    expect(result).toBeCloseTo(21, 0);
  });
});

describe("calculateSuggestedPrice", () => {
  it("applies margin to total cost", () => {
    const result = calculateSuggestedPrice(20, 50);
    expect(result).toBe(30);
  });

  it("returns total cost when margin is 0", () => {
    const result = calculateSuggestedPrice(20, 0);
    expect(result).toBe(20);
  });

  it("handles very high margin", () => {
    const result = calculateSuggestedPrice(10, 1000);
    expect(result).toBe(110);
  });

  it("returns 0 when total cost is 0", () => {
    const result = calculateSuggestedPrice(0, 50);
    expect(result).toBe(0);
  });
});

describe("calculateProfitPerUnit", () => {
  it("calculates profit correctly", () => {
    const result = calculateProfitPerUnit(30, 20);
    expect(result).toBe(10);
  });

  it("returns 0 when price equals cost", () => {
    const result = calculateProfitPerUnit(20, 20);
    expect(result).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    const result = calculateProfitPerUnit(0, 0);
    expect(result).toBe(0);
  });
});

describe("calculatePriceWithFees", () => {
  it("returns the same price and zero fee when feesPercent is 0", () => {
    const result = calculatePriceWithFees(20, 0);
    expect(result.finalPrice).toBe(20);
    expect(result.feesAmount).toBe(0);
  });

  it("grosses up the price so the seller keeps the suggested price", () => {
    // R$20 com 18% de taxas: 20 / 0,82 = 24,3902...
    const result = calculatePriceWithFees(20, 18);
    expect(result.finalPrice).toBeCloseTo(24.39, 2);
    expect(result.feesAmount).toBeCloseTo(4.39, 2);
  });

  it("preserves the net (final − fee = suggested price)", () => {
    const suggested = 37.5;
    const { finalPrice, feesAmount } = calculatePriceWithFees(suggested, 15);
    expect(finalPrice - feesAmount).toBeCloseTo(suggested, 6);
  });

  it("treats negative feesPercent as no fee", () => {
    const result = calculatePriceWithFees(20, -5);
    expect(result.finalPrice).toBe(20);
    expect(result.feesAmount).toBe(0);
  });
});

describe("validatePricingData", () => {
  it("returns empty array for valid data", () => {
    const errors = validatePricingData({
      ingredientCost: 10,
      packagingCost: 5,
      laborCost: 3,
      fixedCostShare: 2,
      marginPercent: 50,
    });
    expect(errors).toEqual([]);
  });

  it("accepts all costs as zero", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 0,
    });
    expect(errors).toEqual([]);
  });

  it("rejects negative ingredient cost", () => {
    const errors = validatePricingData({
      ingredientCost: -1,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 0,
    });
    expect(errors).toContain("Custo de ingredientes não pode ser negativo");
  });

  it("rejects negative packaging cost", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: -1,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 0,
    });
    expect(errors).toContain("Custo de embalagem não pode ser negativo");
  });

  it("rejects negative labor cost", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: -1,
      fixedCostShare: 0,
      marginPercent: 0,
    });
    expect(errors).toContain("Custo de mao de obra não pode ser negativo");
  });

  it("rejects negative fixed cost share", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: -1,
      marginPercent: 0,
    });
    expect(errors).toContain("Rateio de custos fixos não pode ser negativo");
  });

  it("rejects negative margin", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: -1,
    });
    expect(errors).toContain("Margem de lucro não pode ser negativa");
  });

  it("rejects margin over 1000%", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 1001,
    });
    expect(errors).toContain("Margem de lucro não pode exceder 1000%");
  });

  it("rejects negative feesPercent", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 0,
      feesPercent: -1,
    });
    expect(errors).toContain("Taxas em % não podem ser negativas");
  });

  it("rejects feesPercent of 100% or more", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 0,
      feesPercent: 100,
    });
    expect(errors).toContain("Taxas em % não podem chegar a 100%");
  });

  it("accepts a valid feesPercent", () => {
    const errors = validatePricingData({
      ingredientCost: 10,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 50,
      feesPercent: 18,
    });
    expect(errors).toEqual([]);
  });

  it("accumulates multiple errors", () => {
    const errors = validatePricingData({
      ingredientCost: -1,
      packagingCost: -1,
      laborCost: -1,
      fixedCostShare: -1,
      marginPercent: -1,
    });
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });
});
