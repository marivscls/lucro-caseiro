import { describe, expect, it } from "vitest";

import { summarizeFinanceEntries } from "./hooks";

describe("summarizeFinanceEntries", () => {
  it("separa entradas, despesas fixas e variaveis", () => {
    expect(
      summarizeFinanceEntries(
        [
          { amount: 120, isFixed: false, type: "income" },
          { amount: 30, isFixed: true, type: "expense" },
          { amount: 20, isFixed: false, type: "expense" },
          { amount: 80, isFixed: false, type: "income" },
        ],
        "2026-08-16",
      ),
    ).toEqual({
      totalIncome: 200,
      totalExpenses: 50,
      fixedExpenses: 30,
      variableExpenses: 20,
      profit: 150,
      period: "2026-08-16",
    });
  });
});
