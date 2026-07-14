import type { ProductAnalyticsDashboard } from "@lucro-caseiro/contracts";

import type { IAnalyticsRepo, RecordOpenInput } from "./analytics.types";

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

  getDashboard(): Promise<ProductAnalyticsDashboard> {
    return this.repo.getDashboard();
  }
}
