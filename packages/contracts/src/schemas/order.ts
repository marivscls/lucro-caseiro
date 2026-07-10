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
  // Sinal (entrada) ja recebido; validado contra o amount no usecase.
  deposit: z.number().min(0).max(MAX_MONEY).nullable().optional(),
  // Personalizacao (papelaria/festas):
  theme: z.string().max(100).nullable().optional(),
  honoree: z.string().max(100).nullable().optional(),
  colors: z.string().max(100).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
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
  deposit: z.number().nullable(),
  theme: z.string().nullable(),
  honoree: z.string().nullable(),
  colors: z.string().nullable(),
  photoUrl: z.string().nullable(),
  notes: z.string().nullable(),
  saleId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Order = z.infer<typeof OrderDto>;

export const OrdersSummaryDto = z.object({
  totalOrders: z.number(),
  totalAmount: z.number(),
  // "Recebido": soma dos sinais (deposit) ja recebidos das encomendas nao canceladas.
  received: z.number(),
  // "A receber": soma de (valor - sinal) das encomendas nao canceladas.
  toReceive: z.number(),
});

export type OrdersSummary = z.infer<typeof OrdersSummaryDto>;
