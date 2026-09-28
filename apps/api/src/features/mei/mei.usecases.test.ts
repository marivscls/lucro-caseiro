import type { MeiActivity } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import type { IMeiRepo, IMonthlyIncomeProvider } from "./mei.types";
import { MeiUseCases } from "./mei.usecases";

const NOW = new Date("2026-09-28T15:00:00Z");

function makeRepo(): IMeiRepo {
  let activity: MeiActivity | null = "services";
  return {
    getActivity: () => Promise.resolve(activity),
    setActivity: (_u, next) => {
      activity = next;
      return Promise.resolve(next);
    },
  };
}

function income(calls: Array<[number, number]>): IMonthlyIncomeProvider {
  return {
    getMonthlySummary: (_u, month, year) => {
      calls.push([month, year]);
      return Promise.resolve({ totalIncome: 1000 });
    },
  };
}

describe("MeiUseCases", () => {
  it("soma de janeiro até o mês atual", async () => {
    const calls: Array<[number, number]> = [];
    const sut = new MeiUseCases(makeRepo(), income(calls), () => NOW);
    const summary = await sut.getSummary("u");
    expect(calls).toHaveLength(9);
    expect(summary).toMatchObject({ year: 2026, month: 9, yearRevenue: 9000 });
    expect(summary.activity).toBe("services");
  });

  it("para um ano fechado, soma os 12 meses", async () => {
    const calls: Array<[number, number]> = [];
    const sut = new MeiUseCases(makeRepo(), income(calls), () => NOW);
    const summary = await sut.getSummary("u", 2025, 4);
    expect(calls).toHaveLength(12);
    expect(summary.month).toBe(4);
  });

  it("recusa mês que ainda não começou", async () => {
    const sut = new MeiUseCases(makeRepo(), income([]), () => NOW);
    await expect(sut.getSummary("u", 2026, 11)).rejects.toBeInstanceOf(ValidationError);
  });

  it("guarda a atividade escolhida", async () => {
    const sut = new MeiUseCases(makeRepo(), income([]), () => NOW);
    await expect(sut.updateActivity("u", "commerce")).resolves.toEqual({
      activity: "commerce",
    });
  });
});
