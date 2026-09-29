import { z } from "zod";

import { MAX_MONEY, MAX_QUANTITY, PaymentMethod } from "./common";

/** Usos do assistente por mês em cada plano (null = sem limite). */
export const ASSISTANT_MONTHLY_LIMITS = {
  free: 15,
  essential: 300,
  professional: 600,
} as const;

/** Tamanho máximo de áudio/foto enviados (em bytes, depois de decodificar). */
export const ASSISTANT_MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

const Base64File = z.object({
  data: z
    .string()
    .min(1)
    .max(Math.ceil((ASSISTANT_MAX_UPLOAD_BYTES * 4) / 3) + 8),
  mimeType: z.string().min(3).max(60),
});

export const AssistantSaleRequestDto = z
  .object({
    text: z.string().trim().min(3).max(500).optional(),
    audio: Base64File.optional(),
  })
  .refine((data) => Boolean(data.text) !== Boolean(data.audio), {
    message: "Mande o texto ou o áudio",
  });
export type AssistantSaleRequest = z.infer<typeof AssistantSaleRequestDto>;

export const AssistantSaleItemDto = z.object({
  /** Produto já cadastrado que o assistente reconheceu (null = não achou). */
  productId: z.string().uuid().nullable(),
  /** Como a pessoa falou o item. */
  name: z.string(),
  quantity: z.number().positive().max(MAX_QUANTITY),
  /** Preço unitário dito ou o preço cadastrado do produto. */
  unitPrice: z.number().min(0).max(MAX_MONEY).nullable(),
});

export const AssistantSaleDraftDto = z.object({
  /** O que o assistente entendeu (texto ou transcrição do áudio). */
  transcript: z.string(),
  clientId: z.string().uuid().nullable(),
  clientName: z.string().nullable(),
  items: z.array(AssistantSaleItemDto),
  paymentMethod: PaymentMethod.nullable(),
  notes: z.string().nullable(),
  usage: z.object({ used: z.number().int(), limit: z.number().int().nullable() }),
});
export type AssistantSaleDraft = z.infer<typeof AssistantSaleDraftDto>;

export const AssistantUsageDto = z.object({
  used: z.number().int(),
  limit: z.number().int().nullable(),
});
export type AssistantUsage = z.infer<typeof AssistantUsageDto>;
