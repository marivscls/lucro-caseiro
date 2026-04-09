import { z } from "zod";
import { PaymentMethod, SaleStatus } from "./common";

export const SaleItemDto = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export type SaleItem = z.infer<typeof SaleItemDto>;

export const CreateSaleDto = z.object({
  clientId: z.string().uuid().optional(),
  paymentMethod: PaymentMethod,
  items: z.array(SaleItemDto).min(1),
  notes: z.string().max(500).optional(),
  soldAt: z.string().datetime().optional(),
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
  notes: z.string().max(500).optional(),
});

export type UpdateSale = z.infer<typeof UpdateSaleDto>;

export const SaleDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid().nullable(),
  clientName: z.string().nullable(),
  status: SaleStatus,
  paymentMethod: PaymentMethod,
  total: z.number(),
  notes: z.string().nullable(),
  items: z.array(
    SaleItemDto.extend({
      id: z.string().uuid(),
      productName: z.string(),
      subtotal: z.number(),
    }),
  ),
  soldAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Sale = z.infer<typeof SaleDto>;
