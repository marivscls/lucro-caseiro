import { z } from "zod";
import { ExpenseCategory, MAX_MONEY } from "./common";

export const PurchasePaymentStatus = z.enum(["pending", "paid"]);
export type PurchasePaymentStatus = z.infer<typeof PurchasePaymentStatus>;

export const PurchaseItemInputDto = z.object({
  productId: z.string().uuid(),
  variationId: z.string().uuid().optional(),
  quantity: z.number().int().positive().max(1_000_000),
  unitCost: z.number().min(0).max(MAX_MONEY),
});

export type PurchaseItemInput = z.infer<typeof PurchaseItemInputDto>;

export const PurchaseItemDto = PurchaseItemInputDto.extend({
  id: z.string().uuid(),
  productName: z.string(),
  variationId: z.string().uuid().nullable(),
  variationName: z.string().nullable(),
  subtotal: z.number().min(0).max(MAX_MONEY),
});

export type PurchaseItem = z.infer<typeof PurchaseItemDto>;

const PurchaseInputDto = z.object({
  supplierId: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(500),
  amount: z.number().positive().max(MAX_MONEY).optional(),
  items: z.array(PurchaseItemInputDto).max(200).optional(),
  category: ExpenseCategory.optional(),
  // pending = conta a pagar; paid = já saiu (gera lançamento no caixa).
  paymentStatus: PurchasePaymentStatus.optional(),
  purchasedAt: z.string().date(),
  dueDate: z.string().date().nullable().optional(),
});

export const CreatePurchaseDto = PurchaseInputDto.superRefine((data, ctx) => {
  if (!data.amount && !data.items?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amount"],
      message: "Informe o valor ou adicione ao menos um item",
    });
  }
});

export type CreatePurchase = z.infer<typeof CreatePurchaseDto>;

export const UpdatePurchaseDto = PurchaseInputDto.omit({ paymentStatus: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export type UpdatePurchase = z.infer<typeof UpdatePurchaseDto>;

export const PurchaseDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  supplierId: z.string().uuid().nullable(),
  description: z.string(),
  amount: z.number(),
  items: z.array(PurchaseItemDto),
  category: ExpenseCategory,
  paymentStatus: PurchasePaymentStatus,
  purchasedAt: z.string(),
  dueDate: z.string().nullable(),
  paidAt: z.string().nullable(),
  financeEntryId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Purchase = z.infer<typeof PurchaseDto>;
