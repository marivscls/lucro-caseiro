import type { ProlaboreGoal } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { GoalsUseCases } from "./goals.usecases";
import type {
  IAvgProductPriceProvider,
  IGoalsRepo,
  IMonthlyFinanceProvider,
  IMonthlySalesCounter,
  UpsertGoalData,
} from "./goals.types";

const USER_ID = "user-123";

function makeGoal(overrides: Partial<ProlaboreGoal> = {}): ProlaboreGoal {
  return {
    id: "goal-1",
    userId: USER_ID,
    monthlyProlaboreGoal: 2000,
    estimatedMonthlyCosts: null,
    avgTicketOverride: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IGoalsRepo> = {}): IGoalsRepo {
  return {
    findByUser: () => Promise.resolve(makeGoal()),
    upsert: (_userId: string, data: UpsertGoalData) =>
      Promise.resolve(makeGoal({ monthlyProlaboreGoal: data.monthlyProlaboreGoal })),
    deleteByUser: () => Promise.resolve(true),
    ...overrides,
  };
}

function makeFinance(
  overrides: Partial<IMonthlyFinanceProvider> = {},
): IMonthlyFinanceProvider {
  return {
    getMonthlySummary: () => Promise.resolve({ totalIncome: 1000, totalExpenses: 200 }),
    ...overrides,
  };
}

function makeSales(count = 40): IMonthlySalesCounter {
  return { countThisMonth: () => Promise.resolve(count) };
}

function makeProducts(avg: number | null = 30): IAvgProductPriceProvider {
  return { averageActivePrice: () => Promise.resolve(avg) };
}

function makeSut(opts: {
  repo?: Partial<IGoalsRepo>;
  finance?: Partial<IMonthlyFinanceProvider>;
  salesCount?: number;
  avgPrice?: number | null;
}) {
  const repo = makeRepo(opts.repo);
  const sut = new GoalsUseCases(
    repo,
    makeFinance(opts.finance),
    makeSales(opts.salesCount ?? 40),
    makeProducts(opts.avgPrice ?? 30),
  );
  return { sut, repo };
}

describe("GoalsUseCases", () => {
  describe("upsert", () => {
    it("persists a valid goal", async () => {
      const { sut } = makeSut({});
      const result = await sut.upsert(USER_ID, { monthlyProlaboreGoal: 3000 });
      expect(result.monthlyProlaboreGoal).toBe(3000);
    });

    it("throws ValidationError for goal <= 0", async () => {
      const { sut } = makeSut({});
      await expect(sut.upsert(USER_ID, { monthlyProlaboreGoal: 0 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("getProlaboreStatus", () => {
    it("returns empty progress when there is no goal", async () => {
      const { sut } = makeSut({ repo: { findByUser: () => Promise.resolve(null) } });
      const result = await sut.getProlaboreStatus(USER_ID);
      expect(result.config).toBeNull();
      expect(result.progress.requiredRevenue).toBe(0);
      expect(result.progress.salesNeeded).toBeNull();
    });

    it("computes progress using the ticket from current month sales", async () => {
      // income 1000 / 40 sales = ticket 25; required = 2000 + 200 = 2200
      const { sut } = makeSut({});
      const result = await sut.getProlaboreStatus(USER_ID);
      expect(result.progress.requiredRevenue).toBe(2200);
      expect(result.progress.avgTicket).toBe(25);
      expect(result.progress.salesNeeded).toBe(88); // ceil(2200 / 25)
    });

    it("prefers the manual ticket override when set", async () => {
      const { sut } = makeSut({
        repo: { findByUser: () => Promise.resolve(makeGoal({ avgTicketOverride: 100 })) },
      });
      const result = await sut.getProlaboreStatus(USER_ID);
      expect(result.progress.avgTicket).toBe(100);
    });

    it("falls back to average product price when there are no sales", async () => {
      const { sut } = makeSut({
        salesCount: 0,
        avgPrice: 50,
        finance: {
          getMonthlySummary: () => Promise.resolve({ totalIncome: 0, totalExpenses: 0 }),
        },
      });
      const result = await sut.getProlaboreStatus(USER_ID);
      expect(result.progress.avgTicket).toBe(50);
    });
  });
});
