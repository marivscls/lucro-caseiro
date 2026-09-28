import type {
  AnalyticsActionName,
  ProductAnalyticsDashboard,
} from "@lucro-caseiro/contracts";

import {
  isFreshSignup,
  type UserLinkOutcome,
  withoutServerOwnedEvents,
} from "./analytics.domain";
import type {
  IAnalyticsRepo,
  PersistedOpen,
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
    const open: PersistedOpen = {
      ...input,
      openedAt,
      activityDate: utcDateKey(openedAt),
    };
    const link = await this.repo.recordOpen(userId, open);
    await this.recordSignupIfFresh(userId, open, link);
  }

  async recordEvents(userId: string | null, input: RecordEventsInput): Promise<void> {
    const occurredAt = this.now();
    const activityDate = utcDateKey(occurredAt);
    const link = await this.repo.recordEvents(userId, {
      ...input,
      events: withoutServerOwnedEvents(input.events),
      occurredAt,
      activityDate,
    });
    await this.recordSignupIfFresh(
      userId,
      {
        installationId: input.installationId,
        platform: input.platform,
        appVersion: input.appVersion,
        appBuild: input.appBuild,
        openedAt: occurredAt,
        activityDate,
      },
      link,
    );
  }

  private async recordSignupIfFresh(
    userId: string | null,
    open: PersistedOpen,
    link: UserLinkOutcome,
  ): Promise<void> {
    if (userId && isFreshSignup(link, open.openedAt)) {
      await this.repo.recordSignupOnce(userId, open);
    }
  }

  recordUserAction(userId: string, action: AnalyticsActionName): Promise<void> {
    return this.repo.recordUserAction(userId, action, this.now());
  }

  getDashboard(): Promise<ProductAnalyticsDashboard> {
    return this.repo.getDashboard();
  }
}
