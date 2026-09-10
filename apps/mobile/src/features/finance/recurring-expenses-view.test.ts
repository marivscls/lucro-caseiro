import type { RecurringExpense } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  displayRecurringExpenseName,
  nextRecurringExpense,
  sortRecurringExpensesByNextDue,
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

  it("ordena pelo próximo vencimento do ciclo sem alterar os dados de origem", () => {
    expect(
      sortRecurringExpensesByNextDue(items, new Date(2026, 8, 9)).map(
        (item) => item.dayOfMonth,
      ),
    ).toEqual([12, 20, 8]);
    expect(items.map((item) => item.dayOfMonth)).toEqual([20, 8, 12]);
  });

  it("destaca o primeiro vencimento ativo do ciclo mensal", () => {
    const candidates = [
      expense("inativo", 2, "Inativo", false),
      expense("dia-8", 8),
      expense("dia-28", 28),
    ];

    expect(nextRecurringExpense(candidates, new Date(2026, 8, 9))?.id).toBe("dia-28");
  });

  it("considera o próximo mês quando todos os dias deste mês já passaram", () => {
    expect(nextRecurringExpense(items, new Date(2026, 8, 25))?.id).toBe("dia-8");
  });

  it("remove prefixos técnicos do nome exibido", () => {
    expect(displayRecurringExpenseName("[massa] Energia elétrica")).toBe(
      "Energia elétrica",
    );
  });

  it("resume até cinco dias de vencimento no card mensal", () => {
    const candidates = [2, 4, 6, 8, 10, 12].map((day) => expense(String(day), day));
    expect(upcomingRecurringDays(candidates)).toEqual([2, 4, 6, 8, 10]);
  });
});
