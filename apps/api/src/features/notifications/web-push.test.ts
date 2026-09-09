import { describe, expect, it } from "vitest";
import { WebSubscriptionDto, reminderMessage, reminderSlot } from "./web-push.domain";

const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/example",
  keys: { p256dh: `B${"a".repeat(86)}`, auth: "a".repeat(22) },
  timezone: "America/Sao_Paulo",
  prefs: {},
};

describe("browser subscription validation", () => {
  it("accepts browser push providers and valid timezones", () => {
    expect(WebSubscriptionDto.safeParse(subscription).success).toBe(true);
  });
  // HTTP is an intentional rejected fixture, never a transport used by the app.
  it.each([
    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    "http://fcm.googleapis.com/send/x",
    "not-a-url",
    "",
    "https://localhost/x",
    "https://127.0.0.1/x",
    "https://fcm.googleapis.com.evil.test/x",
    "https://user:pass@fcm.googleapis.com/x",
  ])("rejects unsafe endpoint %s", (endpoint) => {
    expect(WebSubscriptionDto.safeParse({ ...subscription, endpoint }).success).toBe(
      false,
    );
  });
  it("rejects invalid timezone, keys and unknown preferences", () => {
    expect(
      WebSubscriptionDto.safeParse({ ...subscription, timezone: "Invalid/Zone" }).success,
    ).toBe(false);
    expect(
      WebSubscriptionDto.safeParse({
        ...subscription,
        keys: { p256dh: "bad", auth: "bad" },
      }).success,
    ).toBe(false);
    expect(
      WebSubscriptionDto.safeParse({ ...subscription, prefs: { UNKNOWN: true } }).success,
    ).toBe(false);
  });
});

describe("server reminders", () => {
  it("uses the device timezone and a one-hour delivery window", () => {
    expect(reminderSlot(new Date("2026-09-09T12:30:00Z"), "America/Sao_Paulo")).toEqual({
      date: "2026-09-09",
      period: "morning",
      monday: false,
    });
    expect(
      reminderSlot(new Date("2026-09-09T22:00:00Z"), "America/Sao_Paulo")?.period,
    ).toBe("evening");
    expect(
      reminderSlot(new Date("2026-09-09T13:00:00Z"), "America/Sao_Paulo"),
    ).toBeNull();
    expect(
      reminderSlot(new Date("2026-09-07T12:00:00Z"), "America/Sao_Paulo")?.monday,
    ).toBe(true);
  });
  const slot = { date: "2026-09-07", period: "morning" as const, monday: true };
  const counts = { pending: 2, stock: 3, deliveries: 1, birthdays: 4 };
  it("respects preferences, plan and brand features", () => {
    const message = reminderMessage(
      slot,
      { PENDING_SALES: false },
      false,
      { estoque: false, agendamento: true },
      counts,
    );
    expect(message?.body).toContain("1 entrega");
    expect(message?.body).not.toMatch(/pendente|estoque|aniversário|semana/);
    expect(message?.url).toBe("/tabs/agenda");
  });
  it("does not send empty reminders or premium reminders on free plans", () => {
    const empty = { pending: 0, stock: 0, deliveries: 0, birthdays: 0 };
    expect(
      reminderMessage(slot, {}, false, { estoque: true, agendamento: true }, empty),
    ).toBeNull();
    expect(
      reminderMessage(
        { ...slot, period: "evening" },
        {},
        false,
        { estoque: true, agendamento: true },
        counts,
      ),
    ).toBeNull();
    expect(
      reminderMessage(
        { ...slot, period: "evening" },
        { DAILY_REMINDER: false },
        true,
        { estoque: true, agendamento: true },
        counts,
      ),
    ).toBeNull();
  });
  it("includes weekly summary on Monday and evening reminder for paid users", () => {
    expect(
      reminderMessage(slot, {}, true, { estoque: true, agendamento: true }, counts)?.body,
    ).toContain("semana");
    expect(
      reminderMessage(
        { ...slot, period: "evening" },
        {},
        true,
        { estoque: true, agendamento: true },
        counts,
      )?.url,
    ).toBe("/finance");
  });
});
