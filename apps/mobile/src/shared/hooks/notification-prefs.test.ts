import { describe, expect, it } from "vitest";

import { isPrefEnabled } from "./notification-prefs";
import { NOTIFICATION_TYPES } from "./notification-types";

describe("isPrefEnabled", () => {
  it("liga por padrão quando não há preferência salva", () => {
    expect(isPrefEnabled({}, NOTIFICATION_TYPES.LOW_STOCK)).toBe(true);
  });

  it("respeita o desligado explícito", () => {
    expect(
      isPrefEnabled(
        { [NOTIFICATION_TYPES.LOW_STOCK]: false },
        NOTIFICATION_TYPES.LOW_STOCK,
      ),
    ).toBe(false);
  });

  it("respeita o ligado explícito", () => {
    expect(
      isPrefEnabled(
        { [NOTIFICATION_TYPES.PENDING_SALES]: true },
        NOTIFICATION_TYPES.PENDING_SALES,
      ),
    ).toBe(true);
  });

  it("um tipo desligado não afeta outro", () => {
    const prefs = { [NOTIFICATION_TYPES.WEEKLY_SUMMARY]: false };
    expect(isPrefEnabled(prefs, NOTIFICATION_TYPES.PENDING_SALES)).toBe(true);
  });
});
