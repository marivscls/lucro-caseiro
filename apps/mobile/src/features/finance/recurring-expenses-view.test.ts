import type { RecurringExpense } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  nextRecurringExpense,
  sortRecurringExpenses,
  upcomingRecurringDays,
} from "./recurring-expenses-view";

function expense(
  id: string,
  dayOfMonth: number,
  description = id,
  active = true,
): RecurringExpense {
  return {
    id,
    userId: "00000000-0000-4000-8000-000000000000",
    category: "utility",
    amount: 10,
    description,
    dayOfMonth,
    active,
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

describe("recurring expenses presentation", () => {
  const items = [expense("dia-20", 20), expense("dia-8", 8), expense("dia-12", 12)];

  it("ordena a lista nos dois sentidos sem alterar os dados de origem", () => {
    expect(sortRecurringExpenses(items, "asc").map((item) => item.dayOfMonth)).toEqual([
      8, 12, 20,
    ]);
    expect(sortRecurringExpenses(items, "desc").map((item) => item.dayOfMonth)).toEqual([
      20, 12, 8,
    ]);
    expect(items.map((item) => item.dayOfMonth)).toEqual([20, 8, 12]);
  });

  it("destaca o primeiro vencimento ativo do ciclo mensal", () => {
    const candidates = [
      expense("inativo", 2, "Inativo", false),
      expense("dia-8", 8),
      expense("dia-28", 28),
    ];

    expect(nextRecurringExpense(candidates)?.id).toBe("dia-8");
    expect(upcomingRecurringDays(candidates)).toEqual([8, 28]);
  });

  it("limita a timeline aos cinco vencimentos mais próximos", () => {
    const candidates = [2, 4, 6, 8, 10, 12].map((day) => expense(String(day), day));
    expect(upcomingRecurringDays(candidates)).toEqual([2, 4, 6, 8, 10]);
  });
});
