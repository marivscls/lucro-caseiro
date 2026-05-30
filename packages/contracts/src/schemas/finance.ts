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
