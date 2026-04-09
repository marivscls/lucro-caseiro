import { describe, expect, it } from "vitest";

import {
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
    expect(errors).toContain("Custo de ingredientes nao pode ser negativo");
  });

  it("rejects negative packaging cost", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: -1,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 0,
    });
    expect(errors).toContain("Custo de embalagem nao pode ser negativo");
  });

  it("rejects negative labor cost", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: -1,
      fixedCostShare: 0,
      marginPercent: 0,
    });
    expect(errors).toContain("Custo de mao de obra nao pode ser negativo");
  });

  it("rejects negative fixed cost share", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: -1,
      marginPercent: 0,
    });
    expect(errors).toContain("Rateio de custos fixos nao pode ser negativo");
  });

  it("rejects negative margin", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: -1,
    });
    expect(errors).toContain("Margem de lucro nao pode ser negativa");
  });

  it("rejects margin over 1000%", () => {
    const errors = validatePricingData({
      ingredientCost: 0,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: 1001,
    });
    expect(errors).toContain("Margem de lucro nao pode exceder 1000%");
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
