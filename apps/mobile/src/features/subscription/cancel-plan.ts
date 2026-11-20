import type { PlanProvider, UserProfile } from "@lucro-caseiro/contracts";
import { isPaidPlan, resolveActivePlan } from "@lucro-caseiro/contracts";

import type { StripeSubscriptionSummary } from "./api";
import { formatMoney } from "./plan-pricing";

/** Data por extenso, ex.: "27 de novembro de 2026". */
export function longDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Loja que cobra a assinatura. O perfil grava a loja desde o teste com cartão;
 * assinaturas antigas não têm o campo, então cai na loja da plataforma (Android
 * compra pela Google Play; web e iOS, pelo cartão no Stripe).
 */
export function cancelProvider(
  profile: Pick<UserProfile, "planProvider"> | null | undefined,
  platform: string,
): PlanProvider {
  if (profile?.planProvider) return profile.planProvider;
  return platform === "android" ? "google_play" : "stripe";
}

export interface CancelPlanCopy {
  readonly title: string;
  readonly message: string;
}

/** O que acontece agora com a assinatura no cartão, em palavras simples. */
export function stripeStatusCopy(summary: StripeSubscriptionSummary): CancelPlanCopy {
  const end = summary.trialEndsAt ?? summary.currentPeriodEnd;
  const endLabel = end ? longDate(end) : null;
  const per = summary.interval === "year" ? "por ano" : "por mês";
  const amount =
    summary.amountCents === null
      ? null
      : `${formatMoney(summary.amountCents / 100)} ${per}`;

  if (summary.cancelAtPeriodEnd) {
    if (summary.status === "trialing") {
      return {
        title: "Teste cancelado",
        message: endLabel
          ? `Você não vai pagar nada. O Premium continua liberado até ${endLabel} e depois sua conta volta para o Gratuito, com seus dados salvos.`
          : "Você não vai pagar nada. No fim do teste, sua conta volta para o Gratuito, com seus dados salvos.",
      };
    }
    return {
      title: "Assinatura cancelada",
      message: endLabel
        ? `Não haverá nova cobrança. O Premium continua liberado até ${endLabel} e depois sua conta volta para o Gratuito, com seus dados salvos.`
        : "Não haverá nova cobrança. No fim do período pago, sua conta volta para o Gratuito, com seus dados salvos.",
    };
  }

  if (summary.status === "trialing") {
    return {
      title: endLabel ? `Seu teste vai até ${endLabel}` : "Você está no teste de 7 dias",
      message:
        endLabel && amount
          ? `Em ${endLabel} cobramos ${amount} no seu cartão. Cancele antes disso e você não paga nada.`
          : "No fim do teste a cobrança começa no seu cartão. Cancele antes e você não paga nada.",
    };
  }

  return {
    title: "Sua assinatura está ativa",
    message:
      endLabel && amount
        ? `Próxima cobrança: ${amount} em ${endLabel}. Se cancelar, você continua com o Premium até essa data e não paga mais nada.`
        : "Se cancelar, você continua com o Premium até o fim do período pago e não paga mais nada.",
  };
}

/** Texto da Google Play: o cancelamento é feito na própria loja. */
export function googlePlayCopy(
  profile: Pick<UserProfile, "plan" | "planExpiresAt" | "planIsTrial"> | null | undefined,
): CancelPlanCopy {
  const active =
    !!profile && isPaidPlan(resolveActivePlan(profile.plan, profile.planExpiresAt));
  const endLabel =
    active && profile?.planExpiresAt ? longDate(profile.planExpiresAt) : null;
  if (profile?.planIsTrial && endLabel) {
    return {
      title: `Seu teste vai até ${endLabel}`,
      message: `A assinatura é cobrada pela Google Play. Para não pagar nada, cancele antes de ${endLabel}: toque no botão abaixo, escolha Lucro Caseiro e depois Cancelar assinatura.`,
    };
  }
  return {
    title: "Cancelar pela Google Play",
    message: endLabel
      ? `A assinatura é cobrada pela Google Play. Toque no botão abaixo, escolha Lucro Caseiro e depois Cancelar assinatura. O Premium continua até ${endLabel}.`
      : "A assinatura é cobrada pela Google Play. Toque no botão abaixo, escolha Lucro Caseiro e depois Cancelar assinatura.",
  };
}
