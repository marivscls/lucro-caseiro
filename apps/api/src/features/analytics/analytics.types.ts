import type {
  ProductAnalyticsDashboard,
  ProductAnalyticsEvent,
} from "@lucro-caseiro/contracts";

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
  recordOpen(userId: string | null, input: PersistedOpen): Promise<void>;
  recordEvents(userId: string | null, input: PersistedEvents): Promise<void>;
  getDashboard(): Promise<ProductAnalyticsDashboard>;
}
