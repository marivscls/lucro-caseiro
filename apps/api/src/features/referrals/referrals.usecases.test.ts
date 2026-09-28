import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import type { IReferralsRepo, PlanState, ReferralAccount } from "./referrals.types";
import { ReferralsUseCases } from "./referrals.usecases";

const NOW = new Date("2026-09-28T12:00:00Z");

function account(overrides: Partial<ReferralAccount> = {}): ReferralAccount {
  return {
    id: "user",
    name: "Célia",
    businessName: "Marmitas da Célia",
    createdAt: new Date("2026-09-27T12:00:00Z"),
    referralCode: "CEAMAR",
    referredBy: null,
    referralRewardedAt: null,
    ...overrides,
  };
}

function makeRepo(state: {
  me?: ReferralAccount;
  friend?: ReferralAccount | null;
  sales?: number;
  granted?: string[];
}): IReferralsRepo {
  const me = state.me ?? account();
  return {
    findAccount: (id) => {
      if (id === me.id) return Promise.resolve(me);
      return Promise.resolve(id === state.friend?.id ? state.friend : null);
    },
    findAccountByCode: (code) =>
      Promise.resolve(state.friend?.referralCode === code ? state.friend : null),
    saveCode: () => Promise.resolve(true),
    setReferredBy: (_id, referrerId) => {
      me.referredBy = referrerId;
      return Promise.resolve(true);
    },
    countInvited: () => Promise.resolve({ invited: 2, rewarded: 1 }),
    countSales: () => Promise.resolve(state.sales ?? 0),
    grantReward: (referred, referrer, _now, nextPlan) => {
      const plan: PlanState = { plan: "free", planExpiresAt: null, planIsTrial: false };
      state.granted?.push(referred, referrer, nextPlan(plan)?.plan ?? "none");
      return Promise.resolve(true);
    },
  };
}

describe("ReferralsUseCases", () => {
  it("cria o código na primeira vez e resume os convites", async () => {
    const sut = new ReferralsUseCases(
      makeRepo({ me: account({ referralCode: null }), sales: 1 }),
      () => NOW,
      () => "CELIA7K2",
    );
    const summary = await sut.getSummary("user");
    expect(summary).toMatchObject({
      code: "CELIA7K2",
      invitedCount: 2,
      rewardedCount: 1,
      canClaim: true,
      salesCount: 1,
      rewardDays: 30,
      requiredSales: 3,
    });
  });

  it("liga a conta a quem convidou e já paga o prêmio se tiver 3 vendas", async () => {
    const granted: string[] = [];
    const friend = account({ id: "friend", referralCode: "ROSA22", name: "Rosa" });
    const sut = new ReferralsUseCases(makeRepo({ friend, sales: 3, granted }), () => NOW);
    const summary = await sut.claim("user", "ROSA22");
    expect(summary.referredByName).toBe("Marmitas da Célia");
    expect(granted).toEqual(["user", "friend", "essential"]);
  });

  it("não paga antes da 3ª venda", async () => {
    const granted: string[] = [];
    const sut = new ReferralsUseCases(
      makeRepo({ me: account({ referredBy: "friend" }), sales: 2, granted }),
      () => NOW,
    );
    await expect(sut.checkReward("user")).resolves.toBe(false);
    expect(granted).toEqual([]);
  });

  it("explica por que o código não vale", async () => {
    const sut = new ReferralsUseCases(makeRepo({ friend: null }), () => NOW);
    await expect(sut.claim("user", "NAOEXISTE")).rejects.toBeInstanceOf(ValidationError);
  });
});
