import { describe, expect, it, vi } from "vitest";

import type { IAnalyticsRepo } from "./analytics.types";
import { AnalyticsUseCases, utcDateKey } from "./analytics.usecases";

const OPEN = {
  installationId: "0cbd1c3e-1755-4f3f-a1bf-40c12b267ac3",
  platform: "android" as const,
  appVersion: "1.2.0",
  appBuild: "19",
};

describe("AnalyticsUseCases", () => {
  it("persiste a abertura com dia UTC determinístico", async () => {
    const openedAt = new Date("2026-07-14T00:30:00.000Z");
    const recordOpen = vi.fn(() => Promise.resolve());
    const repo: IAnalyticsRepo = { recordOpen };
    const sut = new AnalyticsUseCases(repo, () => openedAt);

    await sut.recordOpen("user-1", OPEN);

    expect(recordOpen).toHaveBeenCalledWith("user-1", {
      ...OPEN,
      openedAt,
      activityDate: "2026-07-14",
    });
  });
});

describe("utcDateKey", () => {
  it("não depende do fuso local do servidor", () => {
    expect(utcDateKey(new Date("2026-07-13T23:59:59.999Z"))).toBe("2026-07-13");
  });
});
