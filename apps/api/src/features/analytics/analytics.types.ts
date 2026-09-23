import type {
  AnalyticsActionName,
  ProductAnalyticsDashboard,
  ProductAnalyticsEvent,
} from "@lucro-caseiro/contracts";

import type { UserLinkOutcome } from "./analytics.domain";

export type AnalyticsPlatform = "android" | "ios" | "web";

export interface RecordOpenInput {
  installationId: string;
  platform: AnalyticsPlatform;
  appVersion: string;
  appBuild?: string;
}

export interface PersistedOpen extends RecordOpenInput {
  openedAt: Date;
  activityDate: string;
}

export interface RecordEventsInput extends RecordOpenInput {
  events: ProductAnalyticsEvent[];
}

export interface PersistedEvents extends RecordEventsInput {
  occurredAt: Date;
  activityDate: string;
}

export interface IAnalyticsRepo {
  recordOpen(userId: string | null, input: PersistedOpen): Promise<UserLinkOutcome>;
  recordEvents(userId: string | null, input: PersistedEvents): Promise<UserLinkOutcome>;
  /** Insere `signup_completed` para a conta, a menos que ela já tenha um. */
  recordSignupOnce(userId: string, input: PersistedOpen): Promise<void>;
  recordUserAction(
    userId: string,
    action: AnalyticsActionName,
    occurredAt: Date,
  ): Promise<void>;
  getDashboard(): Promise<ProductAnalyticsDashboard>;
}
