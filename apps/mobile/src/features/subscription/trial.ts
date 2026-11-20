import type { UserProfile } from "@lucro-caseiro/contracts";
import {
  isActiveCardTrial,
  isActiveFreePeriod,
  trialDaysLeft,
} from "@lucro-caseiro/contracts";

type TrialProfile = Pick<UserProfile, "plan" | "planExpiresAt"> & {
  // Opcionais: API antiga não manda os campos (tratado como "não é teste").
  planIsTrial?: boolean;
  planProvider?: UserProfile["planProvider"];
  trialAvailable?: boolean;
};

/**
 * Período grátis SEM cartão ainda valendo (teste antigo do cadastro ou prêmio
 * de indicação). Não é assinatura: para compra a pessoa conta como Gratuito.
 */
export function isProfileOnTrial(
  profile?: TrialProfile | null,
  now: Date = new Date(),
): boolean {
  if (!profile) return false;
  return isActiveFreePeriod(
    profile.plan,
    profile.planExpiresAt,
    profile.planIsTrial,
    profile.planProvider,
    now,
  );
}

/** Teste de 7 dias COM cartão ainda valendo: a loja cobra no fim se não cancelar. */
export function isProfileOnCardTrial(
  profile?: TrialProfile | null,
  now: Date = new Date(),
): boolean {
  if (!profile) return false;
  return isActiveCardTrial(
    profile.plan,
    profile.planExpiresAt,
    profile.planIsTrial,
    profile.planProvider,
    now,
  );
}

/** Data por extenso, ex.: "27 de novembro". */
export function trialChargeDate(expiresAt: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(
    new Date(expiresAt),
  );
}

/** "hoje", "amanhã" ou "em N dias" até o fim do teste. */
export function trialEndLabel(expiresAt: string | null, now: Date = new Date()): string {
  const days = trialDaysLeft(expiresAt, now) ?? 0;
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

export interface TrialNotice {
  readonly title: string;
  readonly message: string;
  /** true quando o teste já acabou (aviso em tom de alerta). */
  readonly ended: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Aviso do teste para a tela de planos. No teste com cartão diz quando cobra e
 * como cancelar. No período grátis sem cartão diz quando termina e, por até 30
 * dias depois, lembra que a conta voltou para o Gratuito.
 * `null` quando a conta não está num teste.
 */
export function trialNotice(
  profile?: TrialProfile | null,
  now: Date = new Date(),
): TrialNotice | null {
  if (!profile?.planIsTrial || !profile.planExpiresAt) return null;

  // Teste com cartão: deixar claro quando cobra e como não pagar.
  if (profile.planProvider) {
    if (!isProfileOnCardTrial(profile, now)) return null;
    return {
      title: `Seu teste do Premium termina ${trialEndLabel(profile.planExpiresAt, now)}`,
      message: `A primeira cobrança acontece em ${trialChargeDate(profile.planExpiresAt)}. Se não quiser continuar, toque em Cancelar assinatura antes disso e você não paga nada.`,
      ended: false,
    };
  }

  if (isProfileOnTrial(profile, now)) {
    return {
      title: `Seu teste do Premium termina ${trialEndLabel(profile.planExpiresAt, now)}`,
      message:
        "Depois disso, sua conta volta para o plano Gratuito e seus dados continuam salvos. Assine para continuar sem limites.",
      ended: false,
    };
  }

  const endedMs = now.getTime() - new Date(profile.planExpiresAt).getTime();
  if (endedMs >= 0 && endedMs <= 30 * DAY_MS) {
    return {
      title: "Seu teste do Premium terminou",
      message:
        "Sua conta voltou para o plano Gratuito e seus dados continuam salvos. Assine para voltar a usar sem limites.",
      ended: true,
    };
  }
  return null;
}
