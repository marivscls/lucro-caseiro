import type { RecurringExpense } from "@lucro-caseiro/contracts";
import { displayIngredientName } from "../../shared/ingredient-image/resolve";

export type RecurringSortDirection = "asc" | "desc";

export function sortRecurringExpenses(
  items: readonly RecurringExpense[],
  direction: RecurringSortDirection,
): RecurringExpense[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...items].sort(
    (left, right) =>
      (left.dayOfMonth - right.dayOfMonth) * multiplier ||
      left.description.localeCompare(right.description, "pt-BR") * multiplier,
  );
}

export function nextRecurringExpense(
  items: readonly RecurringExpense[],
  referenceDate = new Date(),
): RecurringExpense | null {
  const activeItems = items.filter((item) => item.active);
  if (activeItems.length === 0) return null;

  const referenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  function nextOccurrence(item: RecurringExpense): number {
    const currentMonth = new Date(
      referenceDay.getFullYear(),
      referenceDay.getMonth(),
      item.dayOfMonth,
    );
    if (currentMonth >= referenceDay) return currentMonth.getTime();
    return new Date(
      referenceDay.getFullYear(),
      referenceDay.getMonth() + 1,
      item.dayOfMonth,
    ).getTime();
  }

  return [...activeItems].sort(
    (left, right) =>
      nextOccurrence(left) - nextOccurrence(right) ||
      left.description.localeCompare(right.description, "pt-BR"),
  )[0];
}

export function displayRecurringExpenseName(name: string): string {
  return displayIngredientName(name);
}
