import { describe, expect, it } from "vitest";

import {
  buildReferralCode,
  canClaim,
  claimRefusal,
  rewardPlan,
} from "./referrals.domain";
import type { ReferralAccount } from "./referrals.types";

const NOW = new Date("2026-09-28T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function account(overrides: Partial<ReferralAccount> = {}): ReferralAccount {
  return {
    id: "a",
    name: "Célia",
    businessName: null,
    createdAt: new Date(NOW.getTime() - 2 * DAY),
    referralCode: null,
    referredBy: null,
    referralRewardedAt: null,
    ...overrides,
  };
}

describe("buildReferralCode", () => {
  it("usa o nome sem acento e sem letras que confundem, mais letras aleatórias", () => {
    expect(buildReferralCode("Célia Doces", () => 0)).toBe("CEADCAAA");
    expect(buildReferralCode("Marmitas da Rosa", () => 1)).toBe("MARMTBBB");
  });

  it("gera ao menos 6 caracteres mesmo sem nome", () => {
    const code = buildReferralCode("123", () => 2);
    expect(code).toMatch(/^[A-Z0-9]{6,12}$/);
  });
});

describe("claimRefusal", () => {
  it("aceita um código válido de outra pessoa", () => {
    expect(claimRefusal(account(), account({ id: "b" }), NOW)).toBeNull();
  });

  it("recusa depois de 14 dias da conta", () => {
    const old = account({ createdAt: new Date(NOW.getTime() - 15 * DAY) });
    expect(claimRefusal(old, account({ id: "b" }), NOW)).toBe("window_closed");
    expect(canClaim(old, NOW)).toBe(false);
  });

  it("recusa código próprio, desconhecido, repetido e convite em círculo", () => {
    expect(claimRefusal(account(), account(), NOW)).toBe("own_code");
    expect(claimRefusal(account(), null, NOW)).toBe("unknown_code");
    expect(claimRefusal(account({ referredBy: "c" }), account({ id: "b" }), NOW)).toBe(
      "already_referred",
    );
    expect(claimRefusal(account(), account({ id: "b", referredBy: "a" }), NOW)).toBe(
      "circular",
    );
  });
});

describe("rewardPlan", () => {
  it("dá 30 dias de Essencial para quem está no grátis", () => {
    expect(
      rewardPlan({ plan: "free", planExpiresAt: null, planIsTrial: false }, NOW),
    ).toEqual({
      plan: "essential",
      planExpiresAt: new Date(NOW.getTime() + 30 * DAY),
      planIsTrial: true,
    });
  });

  it("soma os 30 dias ao teste que ainda está valendo", () => {
    const end = new Date(NOW.getTime() + 5 * DAY);
    expect(
      rewardPlan({ plan: "essential", planExpiresAt: end, planIsTrial: true }, NOW)
        ?.planExpiresAt,
    ).toEqual(new Date(NOW.getTime() + 35 * DAY));
  });

  it("recomeça do dia de hoje quando o plano pago já venceu", () => {
    const ended = new Date(NOW.getTime() - 3 * DAY);
    expect(
      rewardPlan({ plan: "essential", planExpiresAt: ended, planIsTrial: false }, NOW),
    ).toEqual({
      plan: "essential",
      planExpiresAt: new Date(NOW.getTime() + 30 * DAY),
      planIsTrial: true,
    });
  });

  it("mantém o Profissional de quem está no teste do Profissional", () => {
    const end = new Date(NOW.getTime() + DAY);
    expect(
      rewardPlan({ plan: "professional", planExpiresAt: end, planIsTrial: true }, NOW)
        ?.plan,
    ).toBe("professional");
  });

  it("não mexe em quem já paga assinatura", () => {
    expect(
      rewardPlan(
        {
          plan: "essential",
          planExpiresAt: new Date(NOW.getTime() + 20 * DAY),
          planIsTrial: false,
        },
        NOW,
      ),
    ).toBeNull();
  });
});
