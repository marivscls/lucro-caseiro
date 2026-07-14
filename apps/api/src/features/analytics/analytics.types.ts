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

export interface IAnalyticsRepo {
  recordOpen(userId: string | null, input: PersistedOpen): Promise<void>;
}
