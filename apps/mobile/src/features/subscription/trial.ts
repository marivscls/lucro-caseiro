import type { UserProfile } from "@lucro-caseiro/contracts";
import { isActiveTrial, trialDaysLeft } from "@lucro-caseiro/contracts";

type TrialProfile = Pick<UserProfile, "plan" | "planExpiresAt"> & {
  // Opcional: API antiga não manda o campo (tratado como "não é teste").
  planIsTrial?: boolean;
};

/** Conta nova usando o teste grátis do Essencial (ainda dentro dos 7 dias). */
export function isProfileOnTrial(profile?: TrialProfile | null): boolean {
  if (!profile) return false;
  return isActiveTrial(profile.plan, profile.planExpiresAt, profile.planIsTrial);
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
 * Aviso do teste grátis para a tela de planos. Durante o teste diz quando termina;
 * depois, por até 30 dias, lembra que a conta voltou para o Gratuito.
 * `null` quando a conta não veio do teste.
 */
export function trialNotice(
  profile?: TrialProfile | null,
  now: Date = new Date(),
): TrialNotice | null {
  if (!profile?.planIsTrial || !profile.planExpiresAt) return null;

  if (isProfileOnTrial(profile)) {
    return {
      title: `Seu teste do Essencial termina ${trialEndLabel(profile.planExpiresAt, now)}`,
      message:
        "Depois disso, sua conta volta para o plano Gratuito e seus dados continuam salvos. Assine para continuar sem limites.",
      ended: false,
    };
  }

  const endedMs = now.getTime() - new Date(profile.planExpiresAt).getTime();
  if (endedMs >= 0 && endedMs <= 30 * DAY_MS) {
    return {
      title: "Seu teste do Essencial terminou",
      message:
        "Sua conta voltou para o plano Gratuito e seus dados continuam salvos. Assine para voltar a usar sem limites.",
      ended: true,
    };
  }
  return null;
}
