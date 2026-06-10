import { z } from "zod";

import { MAX_MONEY } from "./common";

export const QuoteStatus = z.enum(["pending", "accepted", "rejected"]);
export type QuoteStatusType = z.infer<typeof QuoteStatus>;

export const QuoteItemDto = z.object({
  description: z.string().min(1).max(200),
  quantity: z.number().positive().max(99999),
  unitPrice: z.number().min(0).max(MAX_MONEY),
});

export type QuoteItem = z.infer<typeof QuoteItemDto>;

export const CreateQuoteDto = z.object({
  title: z.string().min(1).max(200),
  clientId: z.string().uuid().nullable().optional(),
  // Nome livre para cliente nao cadastrado.
  clientName: z.string().max(200).nullable().optional(),
  items: z.array(QuoteItemDto).min(1).max(50),
  validUntil: z.string().date().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type CreateQuote = z.infer<typeof CreateQuoteDto>;

export const UpdateQuoteDto = CreateQuoteDto.partial();
export type UpdateQuote = z.infer<typeof UpdateQuoteDto>;

export const UpdateQuoteStatusDto = z.object({
  status: QuoteStatus,
});
export type UpdateQuoteStatus = z.infer<typeof UpdateQuoteStatusDto>;

// Converte um orçamento aprovado em encomenda (agenda).
export const ConvertQuoteDto = z.object({
  deliveryDate: z.string().date(),
  deliveryTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  deposit: z.number().min(0).max(MAX_MONEY).nullable().optional(),
});
export type ConvertQuote = z.infer<typeof ConvertQuoteDto>;

export const QuoteDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid().nullable(),
  clientName: z.string().nullable(),
  title: z.string(),
  items: z.array(QuoteItemDto),
  total: z.number(),
  status: QuoteStatus,
  validUntil: z.string().nullable(),
  notes: z.string().nullable(),
  orderId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Quote = z.infer<typeof QuoteDto>;
