import { describe, expect, it } from "vitest";

import { calculateProlaboreProgress, emptyProgress, validateGoal } from "./goals.domain";

const PERIOD = "2026-05";

describe("validateGoal", () => {
  it("accepts valid data", () => {
    expect(validateGoal({ monthlyProlaboreGoal: 2000 })).toEqual([]);
  });

  it("rejects goal <= 0", () => {
    expect(validateGoal({ monthlyProlaboreGoal: 0 })).toContain(
      "A meta deve ser maior que zero",
    );
  });

  it("rejects negative estimated costs", () => {
    const errors = validateGoal({
      monthlyProlaboreGoal: 1000,
      estimatedMonthlyCosts: -1,
    });
    expect(errors).toContain("Os custos estimados nao podem ser negativos");
  });

  it("rejects avg ticket <= 0", () => {
    const errors = validateGoal({ monthlyProlaboreGoal: 1000, avgTicketOverride: 0 });
    expect(errors).toContain("O ticket medio deve ser maior que zero");
  });
});

describe("calculateProlaboreProgress", () => {
  it("computes required revenue, remaining and sales when goal not reached", () => {
    const result = calculateProlaboreProgress(
      {
        monthlyProlaboreGoal: 2000,
        estimatedMonthlyCosts: 500,
        totalIncome: 1000,
        totalExpenses: 300,
        avgTicket: 25,
      },
      PERIOD,
    );

    // effectiveCosts = max(300, 500) = 500 -> required = 2500
    expect(result.requiredRevenue).toBe(2500);
    expect(result.currentRevenue).toBe(1000);
    expect(result.remainingRevenue).toBe(1500);
    expect(result.progressPct).toBe(40);
    expect(result.salesNeeded).toBe(100); // 2500 / 25
    expect(result.salesRemaining).toBe(60); // 1500 / 25
    expect(result.reached).toBe(false);
  });

  it("uses real expenses when higher than the estimate", () => {
    const result = calculateProlaboreProgress(
      {
        monthlyProlaboreGoal: 2000,
        estimatedMonthlyCosts: 100,
        totalIncome: 0,
        totalExpenses: 800,
        avgTicket: null,
      },
      PERIOD,
    );
    expect(result.requiredRevenue).toBe(2800); // 2000 + max(800, 100)
  });

  it("caps progress at 100 and marks reached when goal is met", () => {
    const result = calculateProlaboreProgress(
      {
        monthlyProlaboreGoal: 1000,
        estimatedMonthlyCosts: null,
        totalIncome: 5000,
        totalExpenses: 0,
        avgTicket: 50,
      },
      PERIOD,
    );
    expect(result.progressPct).toBe(100);
    expect(result.remainingRevenue).toBe(0);
    expect(result.salesRemaining).toBe(0);
    expect(result.reached).toBe(true);
  });

  it("returns null sales estimates when there is no average ticket", () => {
    const result = calculateProlaboreProgress(
      {
        monthlyProlaboreGoal: 1000,
        estimatedMonthlyCosts: null,
        totalIncome: 0,
        totalExpenses: 0,
        avgTicket: null,
      },
      PERIOD,
    );
    expect(result.salesNeeded).toBeNull();
    expect(result.salesRemaining).toBeNull();
  });

  it("rounds sales up (ceil)", () => {
    const result = calculateProlaboreProgress(
      {
        monthlyProlaboreGoal: 100,
        estimatedMonthlyCosts: 0,
        totalIncome: 0,
        totalExpenses: 0,
        avgTicket: 30,
      },
      PERIOD,
    );
    expect(result.salesNeeded).toBe(4); // ceil(100 / 30)
  });
});

describe("emptyProgress", () => {
  it("returns a zeroed progress with the given period", () => {
    const result = emptyProgress(PERIOD);
    expect(result.requiredRevenue).toBe(0);
    expect(result.reached).toBe(false);
    expect(result.salesNeeded).toBeNull();
    expect(result.period).toBe(PERIOD);
  });
});
