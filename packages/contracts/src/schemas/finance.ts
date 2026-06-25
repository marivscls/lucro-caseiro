import { z } from "zod";
import { ExpenseCategory, FinanceEntryType, MAX_MONEY } from "./common";

export const CreateFinanceEntryDto = z.object({
  type: FinanceEntryType,
  category: ExpenseCategory,
  amount: z.number().positive().max(MAX_MONEY),
  description: z.string().min(1).max(500),
  date: z.string().date(),
  // Classifica despesas como fixas (recorrentes) ou variaveis. Default: variavel.
  isFixed: z.boolean().optional().default(false),
});

export type CreateFinanceEntry = z.infer<typeof CreateFinanceEntryDto>;

export const UpdateFinanceEntryDto = CreateFinanceEntryDto.partial();
export type UpdateFinanceEntry = z.infer<typeof UpdateFinanceEntryDto>;

export const FinanceEntryDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: FinanceEntryType,
  category: ExpenseCategory,
  amount: z.number(),
  description: z.string(),
  isFixed: z.boolean(),
  saleId: z.string().uuid().nullable(),
  date: z.string(),
  createdAt: z.string().datetime(),
});

export type FinanceEntry = z.infer<typeof FinanceEntryDto>;

// --- Gastos recorrentes (despesa fixa que se repete todo mês) ---

export const CreateRecurringExpenseDto = z.object({
  category: ExpenseCategory,
  amount: z.number().positive().max(MAX_MONEY),
  description: z.string().min(1).max(500),
  // Dia do mês em que o gasto cai. 1–28 (evita meses curtos).
  dayOfMonth: z.number().int().min(1).max(28).optional().default(1),
});

export type CreateRecurringExpense = z.infer<typeof CreateRecurringExpenseDto>;

export const UpdateRecurringExpenseDto = CreateRecurringExpenseDto.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateRecurringExpense = z.infer<typeof UpdateRecurringExpenseDto>;

export const RecurringExpenseDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  category: ExpenseCategory,
  amount: z.number(),
  description: z.string(),
  dayOfMonth: z.number().int(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
});

export type RecurringExpense = z.infer<typeof RecurringExpenseDto>;

export const FinanceSummaryDto = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  // Split das despesas: fixedExpenses + variableExpenses = totalExpenses.
  fixedExpenses: z.number(),
  variableExpenses: z.number(),
  profit: z.number(),
  period: z.string(),
});

export type FinanceSummary = z.infer<typeof FinanceSummaryDto>;
