import { describe, expect, it } from "vitest";

import { calculateServicePricing } from "./domain";

describe("calculateServicePricing", () => {
  it("uses duration and hourly rate to calculate labor", () => {
    const result = calculateServicePricing({
      durationMinutes: 90,
      materialCost: 20,
      hourlyRate: 40,
      otherCost: 5,
      fixedCostShare: 10,
      markupPercent: 50,
      feesPercent: 0,
    });

    expect(result.laborCost).toBe(60);
    expect(result.totalCost).toBe(95);
    expect(result.suggestedPrice).toBe(142.5);
  });

  it("grosses up sale fees without hidden costs", () => {
    const result = calculateServicePricing({
      durationMinutes: 60,
      materialCost: 0,
      hourlyRate: 100,
      otherCost: 0,
      fixedCostShare: 0,
      markupPercent: 0,
      feesPercent: 10,
    });

    expect(result.totalCost).toBe(100);
    expect(result.suggestedPrice).toBeCloseTo(111.11, 2);
    expect(result.feesAmount).toBeCloseTo(11.11, 2);
  });

  it("keeps every result at zero when no cost was informed", () => {
    const result = calculateServicePricing({
      durationMinutes: 60,
      materialCost: 0,
      hourlyRate: 0,
      otherCost: 0,
      fixedCostShare: 0,
      markupPercent: 0,
      feesPercent: 0,
    });

    expect(result).toEqual({
      laborCost: 0,
      totalCost: 0,
      suggestedPrice: 0,
      feesAmount: 0,
    });
  });
});
