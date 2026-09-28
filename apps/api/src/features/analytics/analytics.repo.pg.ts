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
} from "@lucro-caseiro/database/schema";
import { desc, eq, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import { ANALYTICS_DASHBOARD_QUERY } from "./analytics.report-query";
import { acquisitionQuery } from "./analytics.acquisition-query";
import type { IAnalyticsRepo, PersistedEvents, PersistedOpen } from "./analytics.types";

type NullableNumber = number | string | null;

interface DashboardRow {
  acquisition?: ProductAnalyticsDashboard["acquisition"];
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
  constructor(
    private db: AppDatabase,
    private excludedUserIds: readonly string[] = [],
  ) {}

  async recordOpen(userId: string | null, input: PersistedOpen): Promise<void> {
    const attribution = {
      utmSource: input.attribution?.source ?? null,
      utmMedium: input.attribution?.medium ?? null,
      utmCampaign: input.attribution?.campaign ?? null,
      utmContent: input.attribution?.content ?? null,
    };
    const hasNoAttribution = sql`${analyticsInstallations.utmSource} IS NULL
      AND ${analyticsInstallations.utmMedium} IS NULL
      AND ${analyticsInstallations.utmCampaign} IS NULL
      AND ${analyticsInstallations.utmContent} IS NULL`;
    await this.db.transaction(async (tx) => {
      await tx
        .insert(analyticsInstallations)
        .values({
          id: input.installationId,
          platform: input.platform,
          appVersion: input.appVersion,
          appBuild: input.appBuild ?? null,
          ...attribution,
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
            utmSource: sql`CASE WHEN ${hasNoAttribution} THEN ${attribution.utmSource} ELSE ${analyticsInstallations.utmSource} END`,
            utmMedium: sql`CASE WHEN ${hasNoAttribution} THEN ${attribution.utmMedium} ELSE ${analyticsInstallations.utmMedium} END`,
            utmCampaign: sql`CASE WHEN ${hasNoAttribution} THEN ${attribution.utmCampaign} ELSE ${analyticsInstallations.utmCampaign} END`,
            utmContent: sql`CASE WHEN ${hasNoAttribution} THEN ${attribution.utmContent} ELSE ${analyticsInstallations.utmContent} END`,
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

        // A origem do cadastro é a conta autenticada, inclusive no OAuth Google.
        // O bloqueio por conta evita duplicação entre dispositivos/requisições.
        // Ao reconhecer uma conta antiga, preservamos sua data real de criação.
        await tx.execute(sql`
          SELECT pg_advisory_xact_lock(hashtextextended(${"analytics-signup:" + userId}, 0))
        `);
        await tx.execute(sql`
          INSERT INTO analytics_events
            (installation_id, user_id, event_type, event_name, app_version, app_build, occurred_at)
          SELECT ${input.installationId}::uuid, account.id, 'action', 'signup_completed',
            ${input.appVersion}, ${input.appBuild ?? null}, account.created_at
          FROM auth.users account
          WHERE account.id = ${userId}::uuid
            AND NOT EXISTS (
              SELECT 1 FROM analytics_events event
              WHERE event.user_id = account.id
                AND event.event_type = 'action'
                AND event.event_name = 'signup_completed'
            )
        `);
      }
    });
  }

  async recordEvents(userId: string | null, input: PersistedEvents): Promise<void> {
    await this.recordOpen(userId, {
      installationId: input.installationId,
      platform: input.platform,
      appVersion: input.appVersion,
      appBuild: input.appBuild,
      attribution: input.attribution,
      openedAt: input.occurredAt,
      activityDate: input.activityDate,
    });

    // Cadastros são registrados pelo servidor ao identificar a conta. Aceitar a
    // alegação do cliente duplicava eventos e contava pedidos sem confirmação.
    const events = input.events.filter((event) => event.name !== "signup_completed");
    if (events.length === 0) return;

    await this.db.insert(analyticsEvents).values(
      events.map((event) => ({
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

  async recordUserAction(
    userId: string,
    action: AnalyticsActionName,
    occurredAt: Date,
  ): Promise<void> {
    if (action === "signup_completed") return;
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
      sql`SELECT dashboard.*, acquisition.report AS acquisition
        FROM (${sql.raw(ANALYTICS_DASHBOARD_QUERY)}) dashboard
        CROSS JOIN (${acquisitionQuery(this.excludedUserIds)}) acquisition`,
    )) as unknown as DashboardRow[];
    const row = rows[0];

    if (!row) throw new Error("Relatório de métricas não retornou dados");

    return {
      acquisition: row.acquisition,
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
