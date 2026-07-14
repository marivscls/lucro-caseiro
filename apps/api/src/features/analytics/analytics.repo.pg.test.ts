import { describe, expect, it, vi } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { AnalyticsRepoPg } from "./analytics.repo.pg";

describe("AnalyticsRepoPg.getDashboard", () => {
  it("normaliza números do Postgres e preserva percentuais sem coorte como null", async () => {
    const execute = vi.fn(() =>
      Promise.resolve([
        {
          generated_at: new Date("2026-07-14T12:00:00.000Z"),
          installations_total: 10,
          installations_7d: 4,
          installations_30d: 10,
          linked_installations: 6,
          signups_total: 6,
          signups_30d: 5,
          activated_users_total: 4,
          eligible_activation_7d: 3,
          activated_within_7d: 2,
          activation_rate_7d_percent: "66.67",
          active_installations_1d: 2,
          active_installations_7d: 5,
          active_installations_30d: 8,
          active_users_1d: 1,
          active_users_7d: 4,
          active_users_30d: 6,
          eligible_d1: 8,
          retained_d1: 4,
          retention_d1_percent: "50.00",
          eligible_d7: 5,
          retained_d7: 2,
          retention_d7_percent: "40.00",
          eligible_d30: 0,
          retained_d30: 0,
          retention_d30_percent: null,
          screen_usage: [
            {
              screen: "pricing",
              visits: 12,
              people: 5,
              active_minutes: "18.50",
              average_active_seconds: "92.50",
            },
          ],
          feature_usage: [{ action: "pricing_completed", events: 7, people: 4 }],
          funnel: [
            {
              stage: "pricing",
              installations: 4,
              previous_stage_percent: "80.00",
            },
          ],
          version_adoption: [
            { app_version: "1.2.0", installations: 8, percent: "80.00" },
          ],
          behavior_retention: [
            {
              behavior: "pricing_completed",
              eligible: 4,
              retained: 2,
              percent: "50.00",
            },
          ],
        },
      ]),
    );
    const repo = new AnalyticsRepoPg({ execute } as unknown as AppDatabase);

    await expect(repo.getDashboard()).resolves.toMatchObject({
      generatedAt: "2026-07-14T12:00:00.000Z",
      installations: { total: 10, last7Days: 4, linkedToUser: 6 },
      activation: { rateWithin7DaysPercent: 66.67 },
      retention: {
        day1: { eligible: 8, retained: 4, percent: 50 },
        day30: { eligible: 0, retained: 0, percent: null },
      },
      screenUsage: [
        {
          screen: "pricing",
          visits: 12,
          people: 5,
          activeMinutes: 18.5,
          averageActiveSeconds: 92.5,
        },
      ],
      featureUsage: [{ action: "pricing_completed", events: 7, people: 4 }],
      funnel: [{ stage: "pricing", installations: 4, previousStagePercent: 80 }],
      versionAdoption: [{ appVersion: "1.2.0", installations: 8, percent: 80 }],
      behaviorRetention: [
        { behavior: "pricing_completed", eligible: 4, retained: 2, percent: 50 },
      ],
    });
    expect(execute).toHaveBeenCalledOnce();
  });
});
