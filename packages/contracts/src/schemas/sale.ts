import { z } from "zod";
import {
  DiscountType,
  MAX_MONEY,
  MAX_QUANTITY,
  PaymentMethod,
  SaleStatus,
} from "./common";

export const SaleItemDto = z.object({
  productId: z.string().uuid(),
  // Quantidade pode ser decimal para venda por peso (ex.: 1.5 kg).
  // Para produtos por unidade o app envia inteiros; aqui so exigimos > 0.
  quantity: z.number().positive().max(MAX_QUANTITY),
  unitPrice: z.number().positive().max(MAX_MONEY),
  variationId: z.string().uuid().optional(),
  variationName: z.string().max(100).optional(),
});

export const CreateSaleDto = z.object({
  clientId: z.string().uuid().optional(),
  paymentMethod: PaymentMethod,
  items: z.array(SaleItemDto).min(1),
  discountType: DiscountType.optional(),
  discountValue: z.number().positive().max(MAX_MONEY).optional(),
  notes: z.string().max(500).optional(),
  soldAt: z.string().datetime().optional(),
}).superRefine((data, ctx) => {
  if ((data.discountType === undefined) !== (data.discountValue === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountValue"],
      message: "Informe o tipo e o valor do desconto",
    });
  }
  if (data.discountType === "percentage" && (data.discountValue ?? 0) > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountValue"],
      message: "O desconto percentual deve ser de no máximo 100%",
    });
  }
});

export type CreateSale = z.infer<typeof CreateSaleDto>;

export const UpdateSaleStatusDto = z.object({
  status: SaleStatus,
});

export type UpdateSaleStatus = z.infer<typeof UpdateSaleStatusDto>;

export const UpdateSaleDto = z.object({
  clientId: z.string().uuid().optional(),
  paymentMethod: PaymentMethod.optional(),
  items: z.array(SaleItemDto).min(1).optional(),
  discountType: DiscountType.nullable().optional(),
  discountValue: z.number().min(0).max(MAX_MONEY).optional(),
  notes: z.string().max(500).optional(),
});

export const SaleDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid().nullable(),
  clientName: z.string().nullable(),
  status: SaleStatus,
  paymentMethod: PaymentMethod,
  subtotal: z.number(),
  discount: z.number(),
  discountType: DiscountType.nullable(),
  discountValue: z.number(),
  total: z.number(),
  notes: z.string().nullable(),
  items: z.array(
    SaleItemDto.extend({
      id: z.string().uuid(),
      productName: z.string(),
      productPhotoUrl: z.string().nullable().optional(),
      subtotal: z.number(),
    }),
  ),
  soldAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Sale = z.infer<typeof SaleDto>;
