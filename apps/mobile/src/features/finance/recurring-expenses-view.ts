import type { RecurringExpense } from "@lucro-caseiro/contracts";

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
): RecurringExpense | null {
  const activeItems = items.filter((item) => item.active);
  if (activeItems.length === 0) return null;

  return [...activeItems].sort(
    (left, right) =>
      left.dayOfMonth - right.dayOfMonth ||
      left.description.localeCompare(right.description, "pt-BR"),
  )[0];
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
