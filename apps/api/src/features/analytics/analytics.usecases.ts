import type {
  AnalyticsActionName,
  ProductAnalyticsDashboard,
} from "@lucro-caseiro/contracts";

import type {
  IAnalyticsRepo,
  RecordEventsInput,
  RecordOpenInput,
} from "./analytics.types";

export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class AnalyticsUseCases {
  constructor(
    private repo: IAnalyticsRepo,
    private now: () => Date = () => new Date(),
  ) {}

  async recordOpen(userId: string | null, input: RecordOpenInput): Promise<void> {
    const openedAt = this.now();
    await this.repo.recordOpen(userId, {
      ...input,
      openedAt,
      activityDate: utcDateKey(openedAt),
    });
  }

  async recordEvents(userId: string | null, input: RecordEventsInput): Promise<void> {
    const occurredAt = this.now();
    await this.repo.recordEvents(userId, {
      ...input,
      occurredAt,
      activityDate: utcDateKey(occurredAt),
    });
  }

  recordUserAction(userId: string, action: AnalyticsActionName): Promise<void> {
    return this.repo.recordUserAction(userId, action, this.now());
  }

  getDashboard(): Promise<ProductAnalyticsDashboard> {
    return this.repo.getDashboard();
  }
}
