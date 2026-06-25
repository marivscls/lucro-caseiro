import { z } from "zod";
import { ExpenseCategory, MAX_MONEY } from "./common";

export const PurchasePaymentStatus = z.enum(["pending", "paid"]);
export type PurchasePaymentStatus = z.infer<typeof PurchasePaymentStatus>;

export const CreatePurchaseDto = z.object({
  supplierId: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(500),
  amount: z.number().positive().max(MAX_MONEY),
  category: ExpenseCategory.optional(),
  // pending = conta a pagar; paid = já saiu (gera lançamento no caixa).
  paymentStatus: PurchasePaymentStatus.optional(),
  purchasedAt: z.string().date(),
  dueDate: z.string().date().nullable().optional(),
});

export type CreatePurchase = z.infer<typeof CreatePurchaseDto>;

export const PurchaseDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  supplierId: z.string().uuid().nullable(),
  description: z.string(),
  amount: z.number(),
  category: ExpenseCategory,
  paymentStatus: PurchasePaymentStatus,
  purchasedAt: z.string(),
  dueDate: z.string().nullable(),
  paidAt: z.string().nullable(),
  financeEntryId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Purchase = z.infer<typeof PurchaseDto>;
