import type { ProlaboreProgress } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { formatCurrency, prolaboreMessage } from "./domain";

function makeProgress(overrides: Partial<ProlaboreProgress> = {}): ProlaboreProgress {
  return {
    requiredRevenue: 2500,
    currentRevenue: 1000,
    remainingRevenue: 1500,
    progressPct: 40,
    salesNeeded: 100,
    salesRemaining: 60,
    avgTicket: 25,
    reached: false,
    period: "2026-05",
    ...overrides,
  };
}

describe("formatCurrency", () => {
  it("formats with comma decimals and thousand separator", () => {
    expect(formatCurrency(1234.5)).toBe("R$ 1.234,50");
  });
});

describe("prolaboreMessage", () => {
  it("celebrates when the goal is reached", () => {
    expect(prolaboreMessage(makeProgress({ reached: true }))).toContain("atingiu");
  });

  it("shows remaining sales when a ticket is known", () => {
    expect(prolaboreMessage(makeProgress({ salesRemaining: 8 }))).toBe(
      "Faltam ~8 vendas para sua meta",
    );
  });

  it("uses singular for one remaining sale", () => {
    expect(prolaboreMessage(makeProgress({ salesRemaining: 1 }))).toBe(
      "Faltam ~1 venda para sua meta",
    );
  });

  it("falls back to remaining revenue when there is no ticket", () => {
    const msg = prolaboreMessage(
      makeProgress({ salesRemaining: null, remainingRevenue: 1500 }),
    );
    expect(msg).toBe("Faltam R$ 1.500,00 para sua meta");
  });
});
