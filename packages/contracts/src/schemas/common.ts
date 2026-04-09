import { z } from "zod";

export const PaginationDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationDto>;

export const PaginatedResponseDto = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

export const IdParamDto = z.object({
  id: z.string().uuid(),
});

export type IdParam = z.infer<typeof IdParamDto>;

export const PaymentMethod = z.enum(["pix", "cash", "card", "credit", "transfer"]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const SaleStatus = z.enum(["pending", "paid", "cancelled"]);
export type SaleStatus = z.infer<typeof SaleStatus>;

export const FinanceEntryType = z.enum(["income", "expense"]);
export type FinanceEntryType = z.infer<typeof FinanceEntryType>;

export const ExpenseCategory = z.enum([
  "sale",
  "material",
  "packaging",
  "transport",
  "fee",
  "utility",
  "other",
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategory>;

export const PackagingType = z.enum(["box", "bag", "pot", "film", "label", "other"]);
export type PackagingType = z.infer<typeof PackagingType>;

export const RecurrenceFrequency = z.enum(["daily", "weekly", "biweekly", "monthly"]);
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequency>;

export const BusinessType = z.enum(["food", "beauty", "crafts", "services", "other"]);
export type BusinessType = z.infer<typeof BusinessType>;

export const PlanType = z.enum(["free", "premium"]);
export type PlanType = z.infer<typeof PlanType>;
