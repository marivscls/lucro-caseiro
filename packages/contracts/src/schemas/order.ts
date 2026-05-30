import { z } from "zod";

import { MAX_MONEY, OrderStatus, PaymentMethod } from "./common";

export const CreateOrderDto = z.object({
  title: z.string().min(1).max(200),
  deliveryDate: z.string().date(),
  deliveryTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  clientId: z.string().uuid().optional(),
  amount: z.number().positive().max(MAX_MONEY).optional(),
  notes: z.string().max(500).optional(),
  status: OrderStatus.optional(),
});

export type CreateOrder = z.infer<typeof CreateOrderDto>;

export const UpdateOrderDto = CreateOrderDto.partial();
export type UpdateOrder = z.infer<typeof UpdateOrderDto>;

export const DeliverOrderDto = z.object({
  registerIncome: z.boolean().default(false),
  paymentMethod: PaymentMethod.optional(),
});

export type DeliverOrder = z.infer<typeof DeliverOrderDto>;

export const OrderDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid().nullable(),
  clientName: z.string().nullable(),
  title: z.string(),
  deliveryDate: z.string(),
  deliveryTime: z.string().nullable(),
  status: OrderStatus,
  amount: z.number().nullable(),
  notes: z.string().nullable(),
  saleId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Order = z.infer<typeof OrderDto>;
