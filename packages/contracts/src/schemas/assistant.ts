import { z } from "zod";

import { MAX_MONEY, MAX_QUANTITY, PaymentMethod } from "./common";
import { PLAN_PRICING, type PaidPlan } from "./plans";

/** Parte máxima do preço mensal do plano que pode ir para a IA do assistente. */
export const ASSISTANT_MAX_PRICE_SHARE = 0.1;

/**
 * Custo de um uso no pior caso (R$): áudio de até 60 s e listas cheias de
 * produtos e clientes, com o raciocínio do modelo desligado. Revisar se o
 * modelo mudar.
 */
export const ASSISTANT_WORST_COST_PER_USE = 0.02;

/** Plano Gratuito: usos para testar, uma vez só (não renova todo mês). */
export const ASSISTANT_FREE_TRIAL_USES = 10;

/**
 * Usos por mês que cabem na fração do plano. Usa o mês do plano anual (o mais
 * barato), para a IA nunca passar da fração em nenhuma forma de pagamento.
 */
function limitForPlan(plan: PaidPlan): number {
  const cheapestMonth = PLAN_PRICING[plan].annual / 12;
  return Math.floor(
    (cheapestMonth * ASSISTANT_MAX_PRICE_SHARE) / ASSISTANT_WORST_COST_PER_USE,
  );
}

/** Usos do assistente em cada plano: por mês nos pagos; no Gratuito, o teste (total). */
export const ASSISTANT_MONTHLY_LIMITS = {
  free: ASSISTANT_FREE_TRIAL_USES,
  essential: limitForPlan("essential"),
  professional: limitForPlan("professional"),
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

export const AssistantUsageDto = z.object({
  used: z.number().int(),
  limit: z.number().int().nullable(),
  /** true no Gratuito: o limite é o teste, não renova no mês seguinte. */
  trial: z.boolean().optional(),
});
export type AssistantUsage = z.infer<typeof AssistantUsageDto>;

export const AssistantSaleDraftDto = z.object({
  /** O que o assistente entendeu (texto ou transcrição do áudio). */
  transcript: z.string(),
  clientId: z.string().uuid().nullable(),
  clientName: z.string().nullable(),
  items: z.array(AssistantSaleItemDto),
  paymentMethod: PaymentMethod.nullable(),
  notes: z.string().nullable(),
  usage: AssistantUsageDto,
});
export type AssistantSaleDraft = z.infer<typeof AssistantSaleDraftDto>;
