import { z } from "zod";
import { ExpenseCategory, FinanceEntryType } from "./common";

export const CreateFinanceEntryDto = z.object({
  type: FinanceEntryType,
  category: ExpenseCategory,
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  date: z.string().date(),
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
  saleId: z.string().uuid().nullable(),
  date: z.string(),
  createdAt: z.string().datetime(),
});

export type FinanceEntry = z.infer<typeof FinanceEntryDto>;

export const FinanceSummaryDto = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  profit: z.number(),
  period: z.string(),
});

export type FinanceSummary = z.infer<typeof FinanceSummaryDto>;
