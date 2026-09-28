import { randomInt } from "node:crypto";

import {
  REFERRAL_CLAIM_WINDOW_DAYS,
  REFERRAL_REWARD_DAYS,
  resolveActivePlan,
} from "@lucro-caseiro/contracts";

import type { PlanState, ReferralAccount } from "./referrals.types";

const DAY_MS = 24 * 60 * 60 * 1000;
// Sem letras e números que se confundem ao ditar (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Código fácil de ditar: até 5 letras do nome + 3 aleatórias (ex.: CELIA7K2). */
export function buildReferralCode(
  name: string,
  random: (max: number) => number = randomInt,
): string {
  const prefix = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/[OIL]/g, "")
    .slice(0, 5);
  const size = Math.max(3, 6 - prefix.length);
  let suffix = "";
  for (let i = 0; i < size; i++) suffix += ALPHABET[random(ALPHABET.length)];
  return `${prefix}${suffix}`;
}

export type ClaimRefusal =
  | "window_closed"
  | "already_referred"
  | "own_code"
  | "unknown_code"
  | "circular";

export const CLAIM_REFUSAL_MESSAGES: Record<ClaimRefusal, string> = {
  window_closed: `O código de convite só pode ser usado nos primeiros ${REFERRAL_CLAIM_WINDOW_DAYS} dias da conta.`,
  already_referred: "Sua conta já está ligada a um convite.",
  own_code: "Esse é o seu próprio código. Mande ele para uma amiga!",
  unknown_code: "Não achamos esse código. Confira as letras e os números.",
  circular: "Vocês duas não podem convidar uma à outra.",
};

export function claimRefusal(
  account: ReferralAccount,
  referrer: ReferralAccount | null,
  now: Date,
): ClaimRefusal | null {
  if (account.referredBy) return "already_referred";
  if (now.getTime() - account.createdAt.getTime() > REFERRAL_CLAIM_WINDOW_DAYS * DAY_MS) {
    return "window_closed";
  }
  if (!referrer) return "unknown_code";
  if (referrer.id === account.id) return "own_code";
  if (referrer.referredBy === account.id) return "circular";
  return null;
}

export function canClaim(account: ReferralAccount, now: Date): boolean {
  return (
    !account.referredBy &&
    now.getTime() - account.createdAt.getTime() <= REFERRAL_CLAIM_WINDOW_DAYS * DAY_MS
  );
}

/**
 * Prêmio da indicação: +30 dias do Essencial. Quem já paga uma assinatura não
 * muda nada (a loja cuida da cobrança). Quem está no grátis ou em teste ganha
 * os dias somados ao que ainda tinha. Teste do Profissional continua Profissional.
 */
export function rewardPlan(
  current: PlanState,
  now: Date,
  days = REFERRAL_REWARD_DAYS,
): PlanState | null {
  const active = resolveActivePlan(
    current.plan,
    current.planExpiresAt?.toISOString() ?? null,
    now,
  );
  if (active !== "free" && !current.planIsTrial) return null;
  const base =
    active !== "free" && current.planExpiresAt && current.planExpiresAt > now
      ? current.planExpiresAt
      : now;
  return {
    plan: active === "professional" ? "professional" : "essential",
    planExpiresAt: new Date(base.getTime() + days * DAY_MS),
    planIsTrial: true,
  };
}
