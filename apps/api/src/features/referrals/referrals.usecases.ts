import {
  REFERRAL_REQUIRED_SALES,
  REFERRAL_REWARD_DAYS,
  type ReferralSummary,
} from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import {
  buildReferralCode,
  canClaim,
  claimRefusal,
  CLAIM_REFUSAL_MESSAGES,
  rewardPlan,
} from "./referrals.domain";
import type { IReferralsRepo, ReferralAccount } from "./referrals.types";

export class ReferralsUseCases {
  constructor(
    private repo: IReferralsRepo,
    private clock: () => Date = () => new Date(),
    private codeFactory: (name: string) => string = (name) => buildReferralCode(name),
  ) {}

  private async account(userId: string): Promise<ReferralAccount> {
    const account = await this.repo.findAccount(userId);
    if (!account) throw new NotFoundError("Perfil não encontrado");
    return account;
  }

  /** Código da conta, criado na primeira vez que alguém pede. */
  async ensureCode(account: ReferralAccount): Promise<string> {
    if (account.referralCode) return account.referralCode;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.codeFactory(account.businessName || account.name);
      if (await this.repo.saveCode(account.id, code)) return code;
    }
    // Outra requisição pode ter gravado o código ao mesmo tempo.
    const fresh = await this.account(account.id);
    if (fresh.referralCode) return fresh.referralCode;
    throw new ValidationError([
      "Não foi possível criar seu código agora. Tente de novo.",
    ]);
  }

  async getSummary(userId: string): Promise<ReferralSummary> {
    const account = await this.account(userId);
    const [code, counts, salesCount, referrer] = await Promise.all([
      this.ensureCode(account),
      this.repo.countInvited(userId),
      this.repo.countSales(userId),
      account.referredBy ? this.repo.findAccount(account.referredBy) : null,
    ]);
    return {
      code,
      invitedCount: counts.invited,
      rewardedCount: counts.rewarded,
      referredByName: referrer ? referrer.businessName || referrer.name : null,
      rewarded: account.referralRewardedAt !== null,
      canClaim: canClaim(account, this.clock()),
      salesCount,
      rewardDays: REFERRAL_REWARD_DAYS,
      requiredSales: REFERRAL_REQUIRED_SALES,
    };
  }

  async claim(userId: string, code: string): Promise<ReferralSummary> {
    const now = this.clock();
    const account = await this.account(userId);
    const referrer = await this.repo.findAccountByCode(code);
    const refusal = claimRefusal(account, referrer, now);
    if (refusal) throw new ValidationError([CLAIM_REFUSAL_MESSAGES[refusal]]);
    if (!(await this.repo.setReferredBy(userId, referrer!.id, now))) {
      throw new ValidationError([CLAIM_REFUSAL_MESSAGES.already_referred]);
    }
    await this.checkReward(userId);
    return this.getSummary(userId);
  }

  /**
   * Chamado depois de cada venda: quando a conta indicada chega a 3 vendas,
   * as duas ganham o prêmio. Idempotente (o repo só paga uma vez).
   */
  async checkReward(userId: string): Promise<boolean> {
    const account = await this.repo.findAccount(userId);
    if (!account?.referredBy || account.referralRewardedAt) return false;
    if ((await this.repo.countSales(userId)) < REFERRAL_REQUIRED_SALES) return false;
    const now = this.clock();
    return this.repo.grantReward(userId, account.referredBy, now, (current) =>
      rewardPlan(current, now),
    );
  }
}
