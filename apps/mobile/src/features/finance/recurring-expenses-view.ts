import type { RecurringExpense } from "@lucro-caseiro/contracts";
import { displayIngredientName } from "../../shared/ingredient-image/resolve";

function nextOccurrenceTimestamp(item: RecurringExpense, referenceDate: Date): number {
  const referenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
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

export function sortRecurringExpensesByNextDue(
  items: readonly RecurringExpense[],
  referenceDate = new Date(),
): RecurringExpense[] {
  return [...items].sort(
    (left, right) =>
      nextOccurrenceTimestamp(left, referenceDate) -
        nextOccurrenceTimestamp(right, referenceDate) ||
      left.description.localeCompare(right.description, "pt-BR"),
  );
}

export function nextRecurringExpense(
  items: readonly RecurringExpense[],
  referenceDate = new Date(),
): RecurringExpense | null {
  const activeItems = items.filter((item) => item.active);
  if (activeItems.length === 0) return null;

  return [...activeItems].sort(
    (left, right) =>
      nextOccurrenceTimestamp(left, referenceDate) -
        nextOccurrenceTimestamp(right, referenceDate) ||
      left.description.localeCompare(right.description, "pt-BR"),
  )[0];
}

export function displayRecurringExpenseName(name: string): string {
  return displayIngredientName(name);
}

export function upcomingRecurringDays(
  items: readonly RecurringExpense[],
  limit = 5,
): number[] {
  const uniqueDays = [
    ...new Set(items.filter((item) => item.active).map((item) => item.dayOfMonth)),
  ];
  uniqueDays.sort((left, right) => left - right);
  return uniqueDays.slice(0, limit);
}
