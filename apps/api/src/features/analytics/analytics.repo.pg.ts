import type {
  AnalyticsActionName,
  AnalyticsScreenName,
  BehaviorRetentionMetric,
  FunnelMetric,
  ProductAnalyticsDashboard,
} from "@lucro-caseiro/contracts";
import {
  analyticsActivityDays,
  analyticsEvents,
  analyticsInstallationUsers,
  analyticsInstallations,
  analyticsUserActivityDays,
  users,
} from "@lucro-caseiro/database/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import { NO_USER_LINK, type UserLinkOutcome } from "./analytics.domain";
import { ANALYTICS_DASHBOARD_QUERY } from "./analytics.report-query";
import type { IAnalyticsRepo, PersistedEvents, PersistedOpen } from "./analytics.types";

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
  screen_usage: unknown;
  feature_usage: unknown;
  funnel: unknown;
  version_adoption: unknown;
  behavior_retention: unknown;
  acquisition_sources: unknown;
}

interface RawAcquisitionSource {
  source: string | null;
  content: string | null;
  installations: number;
  linked_to_user: number;
}

interface RawScreenUsage {
  screen: AnalyticsScreenName;
  visits: number;
  people: number;
  active_minutes: NullableNumber;
  average_active_seconds: NullableNumber;
}

interface RawFeatureUsage {
  action: AnalyticsActionName;
  events: number;
  people: number;
}

interface RawFunnel {
  stage: FunnelMetric["stage"];
  installations: number;
  previous_stage_percent: NullableNumber;
}

interface RawVersionAdoption {
  app_version: string;
  installations: number;
  percent: NullableNumber;
}

interface RawBehaviorRetention {
  behavior: BehaviorRetentionMetric["behavior"];
  eligible: number;
  retained: number;
  percent: NullableNumber;
}

function nullableNumeric(value: NullableNumber): number | null {
  return value == null ? null : Number(value);
}

function parsedArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return [];
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

export class AnalyticsRepoPg implements IAnalyticsRepo {
  constructor(private db: AppDatabase) {}

  async recordOpen(
    userId: string | null,
    input: PersistedOpen,
  ): Promise<UserLinkOutcome> {
    return this.db.transaction(async (tx) => {
      await tx
        .insert(analyticsInstallations)
        .values({
          id: input.installationId,
          platform: input.platform,
          appVersion: input.appVersion,
          appBuild: input.appBuild ?? null,
          utmSource: input.acquisition?.utmSource ?? null,
          utmMedium: input.acquisition?.utmMedium ?? null,
          utmCampaign: input.acquisition?.utmCampaign ?? null,
          utmContent: input.acquisition?.utmContent ?? null,
          referrer: input.acquisition?.referrer ?? null,
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

      if (!userId) return NO_USER_LINK;

      // xmax = 0 só na linha recém-inserida; a PK serializa aberturas concorrentes.
      const [link] = await tx
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
        })
        .returning({ inserted: sql<boolean>`(xmax = 0)` });

      await tx
        .insert(analyticsUserActivityDays)
        .values({ userId, activityDate: input.activityDate })
        .onConflictDoNothing();

      if (!link?.inserted) return NO_USER_LINK;

      const [otherLink] = await tx
        .select({ installationId: analyticsInstallationUsers.installationId })
        .from(analyticsInstallationUsers)
        .where(
          and(
            eq(analyticsInstallationUsers.userId, userId),
            ne(analyticsInstallationUsers.installationId, input.installationId),
          ),
        )
        .limit(1);
      const [user] = await tx
        .select({ createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return { firstUserLink: !otherLink, userCreatedAt: user?.createdAt ?? null };
    });
  }

  async recordSignupOnce(userId: string, input: PersistedOpen): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO analytics_events
        (installation_id, user_id, event_type, event_name, app_version, app_build, occurred_at)
      SELECT ${input.installationId}::uuid, ${userId}::uuid, 'action', 'signup_completed',
        ${input.appVersion}::text, ${input.appBuild ?? null}::text,
        ${input.openedAt.toISOString()}::timestamptz
      WHERE NOT EXISTS (
        SELECT 1 FROM analytics_events
        WHERE user_id = ${userId}::uuid
          AND event_type = 'action'
          AND event_name = 'signup_completed'
      )
    `);
  }

  async recordEvents(
    userId: string | null,
    input: PersistedEvents,
  ): Promise<UserLinkOutcome> {
    const link = await this.recordOpen(userId, {
      installationId: input.installationId,
      platform: input.platform,
      appVersion: input.appVersion,
      appBuild: input.appBuild,
      acquisition: input.acquisition,
      openedAt: input.occurredAt,
      activityDate: input.activityDate,
    });

    if (input.events.length > 0) {
      await this.db.insert(analyticsEvents).values(
        input.events.map((event) => ({
          installationId: input.installationId,
          userId,
          eventType: event.type,
          eventName: event.name,
          durationMs: event.type === "screen_view" ? event.durationMs : null,
          appVersion: input.appVersion,
          appBuild: input.appBuild ?? null,
          occurredAt: input.occurredAt,
        })),
      );
    }
    return link;
  }

  async recordUserAction(
    userId: string,
    action: AnalyticsActionName,
    occurredAt: Date,
  ): Promise<void> {
    const [installation] = await this.db
      .select({
        installationId: analyticsInstallationUsers.installationId,
        appVersion: analyticsInstallations.appVersion,
        appBuild: analyticsInstallations.appBuild,
      })
      .from(analyticsInstallationUsers)
      .innerJoin(
        analyticsInstallations,
        eq(analyticsInstallations.id, analyticsInstallationUsers.installationId),
      )
      .where(eq(analyticsInstallationUsers.userId, userId))
      .orderBy(desc(analyticsInstallationUsers.lastIdentifiedAt))
      .limit(1);

    if (!installation) return;

    await this.db.insert(analyticsEvents).values({
      installationId: installation.installationId,
      userId,
      eventType: "action",
      eventName: action,
      durationMs: null,
      appVersion: installation.appVersion,
      appBuild: installation.appBuild,
      occurredAt,
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
      acquisition: parsedArray<RawAcquisitionSource>(row.acquisition_sources).map(
        (item) => ({
          source: item.source,
          content: item.content,
          installations: Number(item.installations),
          linkedToUser: Number(item.linked_to_user),
        }),
      ),
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
      screenUsage: parsedArray<RawScreenUsage>(row.screen_usage).map((item) => ({
        screen: item.screen,
        visits: Number(item.visits),
        people: Number(item.people),
        activeMinutes: Number(item.active_minutes),
        averageActiveSeconds: Number(item.average_active_seconds),
      })),
      featureUsage: parsedArray<RawFeatureUsage>(row.feature_usage).map((item) => ({
        action: item.action,
        events: Number(item.events),
        people: Number(item.people),
      })),
      funnel: parsedArray<RawFunnel>(row.funnel).map((item) => ({
        stage: item.stage,
        installations: Number(item.installations),
        previousStagePercent: nullableNumeric(item.previous_stage_percent),
      })),
      versionAdoption: parsedArray<RawVersionAdoption>(row.version_adoption).map(
        (item) => ({
          appVersion: item.app_version,
          installations: Number(item.installations),
          percent: nullableNumeric(item.percent),
        }),
      ),
      behaviorRetention: parsedArray<RawBehaviorRetention>(row.behavior_retention).map(
        (item) => ({
          behavior: item.behavior,
          eligible: Number(item.eligible),
          retained: Number(item.retained),
          percent: nullableNumeric(item.percent),
        }),
      ),
    };
  }
}
