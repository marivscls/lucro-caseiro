import { pushNotificationTokens } from "@lucro-caseiro/database/schema";
import { and, eq, inArray } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { INotificationsRepo, RegisterPushTokenInput } from "./notifications.types";

export class NotificationsRepoPg implements INotificationsRepo {
  constructor(private db: AppDatabase) {}

  async registerToken(
    userId: string,
    brandId: string,
    input: RegisterPushTokenInput,
  ): Promise<void> {
    await this.db
      .insert(pushNotificationTokens)
      .values({
        token: input.token,
        userId,
        brandId,
        platform: input.platform,
      })
      .onConflictDoUpdate({
        target: pushNotificationTokens.token,
        set: {
          userId,
          brandId,
          platform: input.platform,
          updatedAt: new Date(),
        },
      });
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.db
      .delete(pushNotificationTokens)
      .where(
        and(
          eq(pushNotificationTokens.userId, userId),
          eq(pushNotificationTokens.token, token),
        ),
      );
  }

  async listTokens(userId: string, brandId: string): Promise<string[]> {
    const rows = await this.db
      .select({ token: pushNotificationTokens.token })
      .from(pushNotificationTokens)
      .where(
        and(
          eq(pushNotificationTokens.userId, userId),
          eq(pushNotificationTokens.brandId, brandId),
        ),
      );
    return rows.map((row) => row.token);
  }

  async deleteTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.db
      .delete(pushNotificationTokens)
      .where(inArray(pushNotificationTokens.token, tokens));
  }
}
