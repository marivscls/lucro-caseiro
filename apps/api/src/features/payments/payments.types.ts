import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";

export type { BillingPeriod, PaidPlan };

export interface CheckoutUrlInput {
  userId: string;
  tier: PaidPlan;
  period: BillingPeriod;
  /** Começa com o teste de 7 dias (cartão obrigatório; cobra no fim). */
  withTrial?: boolean;
}

/** Assinatura Stripe da conta, para a tela de cancelamento. */
export interface StripeSubscriptionSummary {
  status: "trialing" | "active" | "past_due";
  /** Fim do teste (ISO) quando está no teste; `null` fora dele. */
  trialEndsAt: string | null;
  /** Próxima cobrança ou, se cancelada, quando o acesso termina (ISO). */
  currentPeriodEnd: string | null;
  /** Cancelada: não cobra mais e termina em `currentPeriodEnd`. */
  cancelAtPeriodEnd: boolean;
  /** Valor da próxima cobrança em centavos (BRL). */
  amountCents: number | null;
  interval: "month" | "year" | null;
}
