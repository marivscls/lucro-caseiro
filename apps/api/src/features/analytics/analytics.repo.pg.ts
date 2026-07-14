import {
  analyticsActivityDays,
  analyticsInstallationUsers,
  analyticsInstallations,
  analyticsUserActivityDays,
} from "@lucro-caseiro/database/schema";

import type { AppDatabase } from "../../shared/db";
import type { IAnalyticsRepo, PersistedOpen } from "./analytics.types";

export class AnalyticsRepoPg implements IAnalyticsRepo {
  constructor(private db: AppDatabase) {}

  async recordOpen(userId: string | null, input: PersistedOpen): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(analyticsInstallations)
        .values({
          id: input.installationId,
          platform: input.platform,
          appVersion: input.appVersion,
          appBuild: input.appBuild ?? null,
          firstOpenedAt: input.openedAt,
          lastOpenedAt: input.openedAt,
          updatedAt: input.openedAt,
        })
        .onConflictDoUpdate({
          target: analyticsInstallations.id,
          set: {
            platform: input.platform,
            appVersion: input.appVersion,
            appBuild: input.appBuild ?? null,
            lastOpenedAt: input.openedAt,
            updatedAt: input.openedAt,
          },
        });

      await tx
        .insert(analyticsActivityDays)
        .values({
          installationId: input.installationId,
          activityDate: input.activityDate,
          appVersion: input.appVersion,
        })
        .onConflictDoUpdate({
          target: [
            analyticsActivityDays.installationId,
            analyticsActivityDays.activityDate,
          ],
          set: {
            appVersion: input.appVersion,
          },
        });

      if (userId) {
        await tx
          .insert(analyticsInstallationUsers)
          .values({
            installationId: input.installationId,
            userId,
            firstIdentifiedAt: input.openedAt,
            lastIdentifiedAt: input.openedAt,
          })
          .onConflictDoUpdate({
            target: [
              analyticsInstallationUsers.installationId,
              analyticsInstallationUsers.userId,
            ],
            set: { lastIdentifiedAt: input.openedAt },
          });

        await tx
          .insert(analyticsUserActivityDays)
          .values({ userId, activityDate: input.activityDate })
          .onConflictDoNothing();
      }
    });
  }
}
