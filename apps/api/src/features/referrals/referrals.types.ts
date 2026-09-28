export interface ReferralAccount {
  id: string;
  name: string;
  businessName: string | null;
  createdAt: Date;
  referralCode: string | null;
  referredBy: string | null;
  referralRewardedAt: Date | null;
}

export interface PlanState {
  plan: string;
  planExpiresAt: Date | null;
  planIsTrial: boolean;
}

export interface IReferralsRepo {
  findAccount(userId: string): Promise<ReferralAccount | null>;
  findAccountByCode(code: string): Promise<ReferralAccount | null>;
  /** Grava o código só se a conta ainda não tem um. Devolve false se o código já existe. */
  saveCode(userId: string, code: string): Promise<boolean>;
  /** Liga a conta a quem convidou, só se ainda não tiver ninguém. */
  setReferredBy(userId: string, referrerId: string, now: Date): Promise<boolean>;
  countInvited(userId: string): Promise<{ invited: number; rewarded: number }>;
  countSales(userId: string): Promise<number>;
  /**
   * Marca a indicação como paga (uma vez só) e aplica o prêmio nas duas contas,
   * na mesma transação. `nextPlan` decide o novo plano de cada conta (null = não mexe).
   */
  grantReward(
    referredUserId: string,
    referrerId: string,
    now: Date,
    nextPlan: (current: PlanState) => PlanState | null,
  ): Promise<boolean>;
}
