import type { ExpenseCategory, FinanceEntryType } from "@lucro-caseiro/contracts";
export const incomeCategories: readonly ExpenseCategory[] = ["sale", "other"];
export const expenseCategories: readonly ExpenseCategory[] = [
  "material",
  "packaging",
  "transport",
  "fee",
  "utility",
  "other",
];
export function compatibleEntryCategory(
  type: FinanceEntryType,
  category: ExpenseCategory | "",
): ExpenseCategory | "" {
  const allowed = type === "income" ? incomeCategories : expenseCategories;
  return category && allowed.includes(category) ? category : "";
}
