import { ESSENTIAL_TRIAL_DAYS, trialDaysLeft } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { isProfileOnTrial, trialEndLabel, trialNotice } from "./trial";

const NOW = new Date(2026, 8, 24, 10, 0, 0);

function atDays(days: number, hour = 10): string {
  return new Date(2026, 8, 24 + days, hour, 0, 0).toISOString();
}

describe("essential trial helpers", () => {
  it("counts calendar days until the trial ends", () => {
    expect(trialDaysLeft(atDays(ESSENTIAL_TRIAL_DAYS), NOW)).toBe(7);
    expect(trialDaysLeft(atDays(0, 22), NOW)).toBe(0);
    expect(trialDaysLeft(atDays(1, 1), NOW)).toBe(1);
    expect(trialDaysLeft(atDays(-1), NOW)).toBeNull();
    expect(trialDaysLeft(null, NOW)).toBeNull();
  });

  it("labels the end of the trial in simple words", () => {
    expect(trialEndLabel(atDays(0, 22), NOW)).toBe("hoje");
    expect(trialEndLabel(atDays(1), NOW)).toBe("amanhã");
    expect(trialEndLabel(atDays(5), NOW)).toBe("em 5 dias");
  });

  it("only treats an unexpired trial profile as on trial", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(
      isProfileOnTrial({ plan: "essential", planExpiresAt: future, planIsTrial: true }),
    ).toBe(true);
    expect(
      isProfileOnTrial({ plan: "essential", planExpiresAt: past, planIsTrial: true }),
    ).toBe(false);
    expect(
      isProfileOnTrial({ plan: "essential", planExpiresAt: future, planIsTrial: false }),
    ).toBe(false);
    // API antiga sem o campo: não é teste.
    expect(isProfileOnTrial({ plan: "essential", planExpiresAt: future })).toBe(false);
    expect(isProfileOnTrial(null)).toBe(false);
  });

  it("shows when the trial ends and, after it, that the account went back to free", () => {
    const active = trialNotice(
      { plan: "essential", planExpiresAt: atDays(3), planIsTrial: true },
      NOW,
    );
    expect(active).toMatchObject({
      title: "Seu teste do Essencial termina em 3 dias",
      ended: false,
    });

    const today = trialNotice(
      { plan: "essential", planExpiresAt: atDays(0, 20), planIsTrial: true },
      NOW,
    );
    expect(today?.title).toBe("Seu teste do Essencial termina hoje");

    const ended = trialNotice(
      { plan: "essential", planExpiresAt: atDays(-2), planIsTrial: true },
      NOW,
    );
    expect(ended).toMatchObject({
      title: "Seu teste do Essencial terminou",
      ended: true,
    });

    expect(
      trialNotice(
        { plan: "essential", planExpiresAt: atDays(-40), planIsTrial: true },
        NOW,
      ),
    ).toBeNull();
    expect(
      trialNotice(
        { plan: "essential", planExpiresAt: atDays(3), planIsTrial: false },
        NOW,
      ),
    ).toBeNull();
  });
});
