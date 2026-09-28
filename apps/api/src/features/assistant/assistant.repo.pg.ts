import { assistantUsage } from "@lucro-caseiro/database/schema";
import { and, eq, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { IAssistantUsageRepo } from "./assistant.types";

export class AssistantUsageRepoPg implements IAssistantUsageRepo {
  constructor(private db: AppDatabase) {}

  async getCount(userId: string, month: string): Promise<number> {
    const [row] = await this.db
      .select({ count: assistantUsage.count })
      .from(assistantUsage)
      .where(and(eq(assistantUsage.userId, userId), eq(assistantUsage.month, month)));
    return row?.count ?? 0;
  }

  async increment(userId: string, month: string): Promise<number> {
    const [row] = await this.db
      .insert(assistantUsage)
      .values({ userId, month, count: 1 })
      .onConflictDoUpdate({
        target: [assistantUsage.userId, assistantUsage.month],
        set: { count: sql`${assistantUsage.count} + 1` },
      })
      .returning({ count: assistantUsage.count });
    return row?.count ?? 1;
  }
}
