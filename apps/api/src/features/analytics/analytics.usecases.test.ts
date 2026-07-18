import { describe, expect, it, vi } from "vitest";

import type { IAnalyticsRepo } from "./analytics.types";
import { AnalyticsUseCases, utcDateKey } from "./analytics.usecases";

const OPEN = {
  installationId: "0cbd1c3e-1755-4f3f-a1bf-40c12b267ac3",
  platform: "android" as const,
  appVersion: "1.2.0",
  appBuild: "19",
};

const DASHBOARD = {
  generatedAt: "2026-07-14T12:00:00.000Z",
  installations: { total: 10, last7Days: 4, last30Days: 10, linkedToUser: 6 },
  signups: { total: 6, last30Days: 6 },
  activation: {
    activatedUsers: 4,
    eligibleWithin7Days: 3,
    activatedWithin7Days: 2,
    rateWithin7DaysPercent: 66.67,
  },
  active: {
    installations: { day1: 2, day7: 5, day30: 8 },
    users: { day1: 2, day7: 4, day30: 6 },
  },
  retention: {
    day1: { eligible: 8, retained: 4, percent: 50 },
    day7: { eligible: 5, retained: 2, percent: 40 },
    day30: { eligible: 0, retained: 0, percent: null },
  },
  screenUsage: [],
  featureUsage: [],
  funnel: [],
  versionAdoption: [],
  behaviorRetention: [],
};

function analyticsRepo(overrides: Partial<IAnalyticsRepo> = {}): IAnalyticsRepo {
  return {
    recordOpen: vi.fn(() => Promise.resolve()),
    recordEvents: vi.fn(() => Promise.resolve()),
    recordUserAction: vi.fn(() => Promise.resolve()),
    getDashboard: vi.fn(() => Promise.resolve(DASHBOARD)),
    ...overrides,
  };
}

describe("AnalyticsUseCases", () => {
  it("persiste a abertura com dia UTC determinístico", async () => {
    const openedAt = new Date("2026-07-14T00:30:00.000Z");
    const recordOpen = vi.fn(() => Promise.resolve());
    const repo = analyticsRepo({ recordOpen });
    const sut = new AnalyticsUseCases(repo, () => openedAt);

    await sut.recordOpen("user-1", OPEN);

    expect(recordOpen).toHaveBeenCalledWith("user-1", {
      ...OPEN,
      openedAt,
      activityDate: "2026-07-14",
    });
  });

  it("entrega o painel calculado pelo repositório", async () => {
    const getDashboard = vi.fn(() => Promise.resolve(DASHBOARD));
    const sut = new AnalyticsUseCases(analyticsRepo({ getDashboard }));

    await expect(sut.getDashboard()).resolves.toEqual(DASHBOARD);
    expect(getDashboard).toHaveBeenCalledOnce();
  });

  it("persiste eventos com timestamp e dia UTC definidos pelo servidor", async () => {
    const occurredAt = new Date("2026-07-14T23:30:00.000Z");
    const recordEvents = vi.fn(() => Promise.resolve());
    const sut = new AnalyticsUseCases(analyticsRepo({ recordEvents }), () => occurredAt);

    await sut.recordEvents("user-1", {
      ...OPEN,
      events: [{ type: "action", name: "pricing_completed" }],
    });

    expect(recordEvents).toHaveBeenCalledWith("user-1", {
      ...OPEN,
      events: [{ type: "action", name: "pricing_completed" }],
      occurredAt,
      activityDate: "2026-07-14",
    });
  });

  it("persiste ação de negócio autenticada com horário do servidor", async () => {
    const occurredAt = new Date("2026-07-18T18:30:00.000Z");
    const recordUserAction = vi.fn(() => Promise.resolve());
    const sut = new AnalyticsUseCases(
      analyticsRepo({ recordUserAction }),
      () => occurredAt,
    );

    await sut.recordUserAction("user-1", "subscription_completed");

    expect(recordUserAction).toHaveBeenCalledWith(
      "user-1",
      "subscription_completed",
      occurredAt,
    );
  });
});

describe("utcDateKey", () => {
  it("não depende do fuso local do servidor", () => {
    expect(utcDateKey(new Date("2026-07-13T23:59:59.999Z"))).toBe("2026-07-13");
  });
});
