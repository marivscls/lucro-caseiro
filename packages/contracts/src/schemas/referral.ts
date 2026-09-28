import { z } from "zod";

/** Dias do Essencial que as duas contas ganham quando a indicação vale. */
export const REFERRAL_REWARD_DAYS = 30;
/** Vendas que a conta indicada precisa registrar para a indicação valer. */
export const REFERRAL_REQUIRED_SALES = 3;
/** Até quantos dias depois do cadastro dá para informar um código de convite. */
export const REFERRAL_CLAIM_WINDOW_DAYS = 14;

/** Código de convite: 6 a 12 letras/números, sem diferença de maiúscula. */
export const ReferralCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,12}$/, "Código de convite inválido");

export const ClaimReferralDto = z.object({
  code: ReferralCode,
});

export const ReferralSummaryDto = z.object({
  code: z.string(),
  invitedCount: z.number().int(),
  rewardedCount: z.number().int(),
  /** Nome de quem convidou esta conta, quando houver. */
  referredByName: z.string().nullable(),
  /** Indicação desta conta já valeu (as duas ganharam). */
  rewarded: z.boolean(),
  /** Ainda dá para informar o código de quem convidou. */
  canClaim: z.boolean(),
  /** Vendas que esta conta já registrou (para mostrar o progresso até 3). */
  salesCount: z.number().int(),
  rewardDays: z.number().int(),
  requiredSales: z.number().int(),
});
export type ReferralSummary = z.infer<typeof ReferralSummaryDto>;
