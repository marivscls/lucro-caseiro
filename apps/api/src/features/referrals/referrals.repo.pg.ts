import { sales, users } from "@lucro-caseiro/database/schema";
import { and, count, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { IReferralsRepo, PlanState, ReferralAccount } from "./referrals.types";

type PlanColumn = "free" | "premium" | "essential" | "professional";

const accountColumns = {
  id: users.id,
  name: users.name,
  businessName: users.businessName,
  createdAt: users.createdAt,
  referralCode: users.referralCode,
  referredBy: users.referredBy,
  referralRewardedAt: users.referralRewardedAt,
};

export class ReferralsRepoPg implements IReferralsRepo {
  constructor(private db: AppDatabase) {}

  async findAccount(userId: string): Promise<ReferralAccount | null> {
    const [row] = await this.db
      .select(accountColumns)
      .from(users)
      .where(eq(users.id, userId));
    return row ?? null;
  }

  async findAccountByCode(code: string): Promise<ReferralAccount | null> {
    const [row] = await this.db
      .select(accountColumns)
      .from(users)
      .where(eq(users.referralCode, code.toUpperCase()));
    return row ?? null;
  }

  async saveCode(userId: string, code: string): Promise<boolean> {
    try {
      const rows = await this.db
        .update(users)
        .set({ referralCode: code })
        .where(and(eq(users.id, userId), isNull(users.referralCode)))
        .returning({ id: users.id });
      return rows.length > 0;
    } catch {
      // Código repetido (índice único): quem chamou tenta outro.
      return false;
    }
  }

  async setReferredBy(userId: string, referrerId: string, now: Date): Promise<boolean> {
    const rows = await this.db
      .update(users)
      .set({ referredBy: referrerId, referredAt: now })
      .where(and(eq(users.id, userId), isNull(users.referredBy)))
      .returning({ id: users.id });
    return rows.length > 0;
  }

  async countInvited(userId: string): Promise<{ invited: number; rewarded: number }> {
    const [row] = await this.db
      .select({
        invited: count(),
        rewarded: sql<number>`count(${users.referralRewardedAt})::int`,
      })
      .from(users)
      .where(eq(users.referredBy, userId));
    return { invited: Number(row?.invited ?? 0), rewarded: Number(row?.rewarded ?? 0) };
  }

  async countSales(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(sales)
      .where(and(eq(sales.userId, userId), ne(sales.status, "cancelled")));
    return Number(row?.total ?? 0);
  }

  async grantReward(
    referredUserId: string,
    referrerId: string,
    now: Date,
    nextPlan: (current: PlanState) => PlanState | null,
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const claimed = await tx
        .update(users)
        .set({ referralRewardedAt: now })
        .where(
          and(
            eq(users.id, referredUserId),
            eq(users.referredBy, referrerId),
            isNotNull(users.referredBy),
            isNull(users.referralRewardedAt),
          ),
        )
        .returning({ id: users.id });
      if (claimed.length === 0) return false;

      for (const id of [referredUserId, referrerId]) {
        const [row] = await tx
          .select({
            plan: users.plan,
            planExpiresAt: users.planExpiresAt,
            planIsTrial: users.planIsTrial,
          })
          .from(users)
          .where(eq(users.id, id))
          .for("update");
        if (!row) continue;
        const next = nextPlan(row);
        if (!next) continue;
        await tx
          .update(users)
          .set({
            plan: next.plan as PlanColumn,
            planExpiresAt: next.planExpiresAt,
            planIsTrial: next.planIsTrial,
          })
          .where(eq(users.id, id));
      }
      return true;
    });
  }
}
