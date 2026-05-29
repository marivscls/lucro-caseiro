import type { ProlaboreGoal } from "@lucro-caseiro/contracts";
import { businessGoals } from "@lucro-caseiro/database/schema";
import { eq } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { IGoalsRepo, UpsertGoalData } from "./goals.types";

export class GoalsRepoPg implements IGoalsRepo {
  constructor(private db: AppDatabase) {}

  async findByUser(userId: string): Promise<ProlaboreGoal | null> {
    const [row] = await this.db
      .select()
      .from(businessGoals)
      .where(eq(businessGoals.userId, userId));

    return row ? this.toGoal(row) : null;
  }

  async upsert(userId: string, data: UpsertGoalData): Promise<ProlaboreGoal> {
    const values = {
      userId,
      monthlyProlaboreGoal: String(data.monthlyProlaboreGoal),
      estimatedMonthlyCosts:
        data.estimatedMonthlyCosts != null ? String(data.estimatedMonthlyCosts) : null,
      avgTicketOverride:
        data.avgTicketOverride != null ? String(data.avgTicketOverride) : null,
      updatedAt: new Date(),
    };

    const [row] = await this.db
      .insert(businessGoals)
      .values(values)
      .onConflictDoUpdate({
        target: businessGoals.userId,
        set: {
          monthlyProlaboreGoal: values.monthlyProlaboreGoal,
          estimatedMonthlyCosts: values.estimatedMonthlyCosts,
          avgTicketOverride: values.avgTicketOverride,
          updatedAt: values.updatedAt,
        },
      })
      .returning();

    return this.toGoal(row!);
  }

  async deleteByUser(userId: string): Promise<boolean> {
    const [row] = await this.db
      .delete(businessGoals)
      .where(eq(businessGoals.userId, userId))
      .returning({ id: businessGoals.id });

    return !!row;
  }

  private toGoal(row: typeof businessGoals.$inferSelect): ProlaboreGoal {
    return {
      id: row.id,
      userId: row.userId,
      monthlyProlaboreGoal: Number(row.monthlyProlaboreGoal),
      estimatedMonthlyCosts:
        row.estimatedMonthlyCosts != null ? Number(row.estimatedMonthlyCosts) : null,
      avgTicketOverride:
        row.avgTicketOverride != null ? Number(row.avgTicketOverride) : null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
