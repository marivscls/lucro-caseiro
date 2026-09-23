import { describe, expect, it, vi } from "vitest";

import { NO_USER_LINK, type UserLinkOutcome } from "./analytics.domain";
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
  acquisition: [],
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
    recordOpen: vi.fn(() => Promise.resolve(NO_USER_LINK)),
    recordEvents: vi.fn(() => Promise.resolve(NO_USER_LINK)),
    recordSignupOnce: vi.fn(() => Promise.resolve()),
    recordUserAction: vi.fn(() => Promise.resolve()),
    getDashboard: vi.fn(() => Promise.resolve(DASHBOARD)),
    ...overrides,
  };
}

describe("AnalyticsUseCases", () => {
  it("persiste a abertura com dia UTC determinístico", async () => {
    const openedAt = new Date("2026-07-14T00:30:00.000Z");
    const recordOpen = vi.fn(() => Promise.resolve(NO_USER_LINK));
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
    const recordEvents = vi.fn(() => Promise.resolve(NO_USER_LINK));
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

describe("AnalyticsUseCases — cadastro registrado pelo servidor", () => {
  const identifiedAt = new Date("2026-09-20T12:00:00.000Z");
  const freshLink: UserLinkOutcome = {
    firstUserLink: true,
    userCreatedAt: new Date("2026-09-20T11:59:00.000Z"),
  };

  function sutWith(link: UserLinkOutcome) {
    const recordSignupOnce = vi.fn(() => Promise.resolve());
    const recordEvents = vi.fn(() => Promise.resolve(link));
    const repo = analyticsRepo({
      recordOpen: vi.fn(() => Promise.resolve(link)),
      recordEvents,
      recordSignupOnce,
    });
    return {
      sut: new AnalyticsUseCases(repo, () => identifiedAt),
      recordSignupOnce,
      recordEvents,
    };
  }

  it("registra o cadastro na primeira identificação de uma conta nova (Google ou e-mail)", async () => {
    // Arrange
    const { sut, recordSignupOnce } = sutWith(freshLink);

    // Act
    await sut.recordOpen("user-1", OPEN);

    // Assert
    expect(recordSignupOnce).toHaveBeenCalledWith("user-1", {
      ...OPEN,
      openedAt: identifiedAt,
      activityDate: "2026-09-20",
    });
  });

  it("registra o cadastro também quando a primeira identificação chega por eventos", async () => {
    // Arrange
    const { sut, recordSignupOnce } = sutWith(freshLink);

    // Act
    await sut.recordEvents("user-1", {
      ...OPEN,
      events: [{ type: "action", name: "pricing_started" }],
    });

    // Assert
    expect(recordSignupOnce).toHaveBeenCalledOnce();
  });

  it("não conta como cadastro conta antiga, conta já vista ou abertura anônima", async () => {
    // Arrange
    const oldAccount = sutWith({
      firstUserLink: true,
      userCreatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    const seenAccount = sutWith({ ...freshLink, firstUserLink: false });
    const anonymous = sutWith(freshLink);

    // Act
    await oldAccount.sut.recordOpen("user-1", OPEN);
    await seenAccount.sut.recordOpen("user-1", OPEN);
    await anonymous.sut.recordOpen(null, OPEN);

    // Assert
    expect(oldAccount.recordSignupOnce).not.toHaveBeenCalled();
    expect(seenAccount.recordSignupOnce).not.toHaveBeenCalled();
    expect(anonymous.recordSignupOnce).not.toHaveBeenCalled();
  });

  it("descarta signup_completed enviado por versões antigas do app", async () => {
    // Arrange
    const { sut, recordEvents } = sutWith(NO_USER_LINK);

    // Act
    await sut.recordEvents("user-1", {
      ...OPEN,
      events: [
        { type: "action", name: "signup_completed" },
        { type: "action", name: "pricing_started" },
      ],
    });

    // Assert
    expect(recordEvents).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ events: [{ type: "action", name: "pricing_started" }] }),
    );
  });
});

describe("utcDateKey", () => {
  it("não depende do fuso local do servidor", () => {
    expect(utcDateKey(new Date("2026-07-13T23:59:59.999Z"))).toBe("2026-07-13");
  });
});
