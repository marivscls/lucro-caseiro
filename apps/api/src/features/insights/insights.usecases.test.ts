import type { MonthlyRevenue, TopClient, TopProduct } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { monthKeys } from "./insights.domain";
import type { IInsightsRepo } from "./insights.types";
import { InsightsUseCases } from "./insights.usecases";

const USER = "user-1";

function makeRepo(overrides: Partial<IInsightsRepo> = {}): IInsightsRepo {
  return {
    topProducts: () => Promise.resolve([]),
    topClients: () => Promise.resolve([]),
    monthlyRevenue: () => Promise.resolve([]),
    ...overrides,
  };
}

function makeSut(overrides: Partial<IInsightsRepo> = {}) {
  const repo = makeRepo(overrides);
  return { sut: new InsightsUseCases(repo), repo };
}

describe("InsightsUseCases.getInsights", () => {
  it("limita a janela em no máximo 12 meses", async () => {
    const { sut } = makeSut();
    const result = await sut.getInsights(USER, 99);
    expect(result.months).toBe(12);
    expect(result.monthlyRevenue).toHaveLength(12);
  });

  it("usa 6 meses por padrão", async () => {
    const { sut } = makeSut();
    const result = await sut.getInsights(USER);
    expect(result.months).toBe(6);
    expect(result.monthlyRevenue).toHaveLength(6);
  });

  it("preenche meses sem vendas com zero e mantém ordem cronológica", async () => {
    const { sut } = makeSut();
    const result = await sut.getInsights(USER, 3);
    expect(
      result.monthlyRevenue.every((m) => m.revenue === 0 && m.salesCount === 0),
    ).toBe(true);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalSales).toBe(0);
    const keys = result.monthlyRevenue.map((m) => m.month);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it("mescla a receita dos meses retornados e soma os totais", async () => {
    const keys = monthKeys(new Date(), 3);
    const monthly: MonthlyRevenue[] = [
      { month: keys[0]!, revenue: 100, salesCount: 2 },
      { month: keys[2]!, revenue: 50, salesCount: 1 },
    ];
    const { sut } = makeSut({ monthlyRevenue: () => Promise.resolve(monthly) });

    const result = await sut.getInsights(USER, 3);

    expect(result.monthlyRevenue).toHaveLength(3);
    expect(result.monthlyRevenue[0]).toEqual(monthly[0]);
    expect(result.monthlyRevenue[1]).toEqual({
      month: keys[1],
      revenue: 0,
      salesCount: 0,
    });
    expect(result.totalRevenue).toBe(150);
    expect(result.totalSales).toBe(3);
  });

  it("repassa top produtos e top clientes do repositório", async () => {
    const topProducts: TopProduct[] = [
      { productId: "p1", name: "Bolo", quantity: 10, revenue: 500 },
    ];
    const topClients: TopClient[] = [
      { clientId: "c1", name: "Maria", totalSpent: 800, salesCount: 4 },
    ];
    const { sut } = makeSut({
      topProducts: () => Promise.resolve(topProducts),
      topClients: () => Promise.resolve(topClients),
    });

    const result = await sut.getInsights(USER, 6);

    expect(result.topProducts).toEqual(topProducts);
    expect(result.topClients).toEqual(topClients);
  });
});
