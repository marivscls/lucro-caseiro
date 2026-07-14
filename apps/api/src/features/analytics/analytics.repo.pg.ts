import type { ProductAnalyticsDashboard } from "@lucro-caseiro/contracts";
import {
  analyticsActivityDays,
  analyticsInstallationUsers,
  analyticsInstallations,
  analyticsUserActivityDays,
} from "@lucro-caseiro/database/schema";
import { sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import { ANALYTICS_DASHBOARD_QUERY } from "./analytics.report-query";
import type { IAnalyticsRepo, PersistedOpen } from "./analytics.types";

type NullableNumber = number | string | null;

interface DashboardRow {
  generated_at: Date | string;
  installations_total: number;
  installations_7d: number;
  installations_30d: number;
  linked_installations: number;
  signups_total: number;
  signups_30d: number;
  activated_users_total: number;
  eligible_activation_7d: number;
  activated_within_7d: number;
  activation_rate_7d_percent: NullableNumber;
  active_installations_1d: number;
  active_installations_7d: number;
  active_installations_30d: number;
  active_users_1d: number;
  active_users_7d: number;
  active_users_30d: number;
  eligible_d1: number;
  retained_d1: number;
  retention_d1_percent: NullableNumber;
  eligible_d7: number;
  retained_d7: number;
  retention_d7_percent: NullableNumber;
  eligible_d30: number;
  retained_d30: number;
  retention_d30_percent: NullableNumber;
}

function nullableNumeric(value: NullableNumber): number | null {
  return value == null ? null : Number(value);
}

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

  async getDashboard(): Promise<ProductAnalyticsDashboard> {
    const rows = (await this.db.execute(
      sql.raw(ANALYTICS_DASHBOARD_QUERY),
    )) as unknown as DashboardRow[];
    const row = rows[0];

    if (!row) throw new Error("Relatório de métricas não retornou dados");

    return {
      generatedAt: new Date(String(row.generated_at)).toISOString(),
      installations: {
        total: Number(row.installations_total),
        last7Days: Number(row.installations_7d),
        last30Days: Number(row.installations_30d),
        linkedToUser: Number(row.linked_installations),
      },
      signups: {
        total: Number(row.signups_total),
        last30Days: Number(row.signups_30d),
      },
      activation: {
        activatedUsers: Number(row.activated_users_total),
        eligibleWithin7Days: Number(row.eligible_activation_7d),
        activatedWithin7Days: Number(row.activated_within_7d),
        rateWithin7DaysPercent: nullableNumeric(row.activation_rate_7d_percent),
      },
      active: {
        installations: {
          day1: Number(row.active_installations_1d),
          day7: Number(row.active_installations_7d),
          day30: Number(row.active_installations_30d),
        },
        users: {
          day1: Number(row.active_users_1d),
          day7: Number(row.active_users_7d),
          day30: Number(row.active_users_30d),
        },
      },
      retention: {
        day1: {
          eligible: Number(row.eligible_d1),
          retained: Number(row.retained_d1),
          percent: nullableNumeric(row.retention_d1_percent),
        },
        day7: {
          eligible: Number(row.eligible_d7),
          retained: Number(row.retained_d7),
          percent: nullableNumeric(row.retention_d7_percent),
        },
        day30: {
          eligible: Number(row.eligible_d30),
          retained: Number(row.retained_d30),
          percent: nullableNumeric(row.retention_d30_percent),
        },
      },
    };
  }
}
