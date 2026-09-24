import { describe, expect, it } from "vitest";

import {
  decidePlayPlanChange,
  parsePlayPushBody,
  type PlayPlanDecisionInput,
} from "./google-play-rtdn.domain";
import type { GooglePlaySubscriptionSnapshot } from "./subscription.types";

const PACKAGE = "br.com.orionseven.lucrocaseiro";
const DAY = 86_400_000;

function pushBody(notification: unknown, messageId = "msg-1") {
  return {
    message: {
      messageId,
      data: Buffer.from(JSON.stringify(notification)).toString("base64"),
    },
    subscription: "projects/p/subscriptions/s",
  };
}

function inDays(days: number): Date {
  return new Date(Date.now() + days * DAY);
}

function makeSnapshot(
  overrides: Partial<GooglePlaySubscriptionSnapshot> = {},
): GooglePlaySubscriptionSnapshot {
  return {
    plan: "professional",
    active: true,
    expiresAt: inDays(30),
    purchaseOwnerId: "user-1",
    ...overrides,
  };
}

function makeInput(
  overrides: Partial<PlayPlanDecisionInput> = {},
): PlayPlanDecisionInput {
  return {
    snapshot: makeSnapshot(),
    claimedByOwner: true,
    currentProfile: { plan: "professional", planExpiresAt: inDays(1).toISOString() },
    ...overrides,
  };
}

describe("parsePlayPushBody", () => {
  it("extracts the purchase token of a subscription notification", () => {
    // Arrange
    const body = pushBody({
      version: "1.0",
      packageName: PACKAGE,
      subscriptionNotification: {
        version: "1.0",
        notificationType: 2,
        purchaseToken: "token-1",
        subscriptionId: "lucrocaseiro_professional_monthly",
      },
    });

    // Act
    const result = parsePlayPushBody(body, PACKAGE);

    // Assert
    expect(result).toEqual({
      kind: "subscription",
      messageId: "msg-1",
      purchaseToken: "token-1",
      notificationType: 2,
      subscriptionId: "lucrocaseiro_professional_monthly",
    });
  });

  it("ignores the Play Console test notification", () => {
    // Arrange
    const body = pushBody({ packageName: PACKAGE, testNotification: { version: "1.0" } });

    // Act
    const result = parsePlayPushBody(body, PACKAGE);

    // Assert
    expect(result).toEqual({
      kind: "ignore",
      messageId: "msg-1",
      reason: "test_notification",
    });
  });

  it("ignores notifications for another package", () => {
    // Arrange
    const body = pushBody({
      packageName: "com.other.app",
      subscriptionNotification: { notificationType: 2, purchaseToken: "token-1" },
    });

    // Act
    const result = parsePlayPushBody(body, PACKAGE);

    // Assert
    expect(result).toMatchObject({ kind: "ignore", reason: "package_mismatch" });
  });

  it("ignores other notification kinds", () => {
    // Arrange
    const body = pushBody({
      packageName: PACKAGE,
      oneTimeProductNotification: { purchaseToken: "token-1" },
    });

    // Act
    const result = parsePlayPushBody(body, PACKAGE);

    // Assert
    expect(result).toMatchObject({ kind: "ignore", reason: "unsupported_notification" });
  });

  it.each([
    ["missing message", {}],
    ["non base64 json", { message: { data: "%%%" } }],
    [
      "subscription without token",
      pushBody({
        packageName: PACKAGE,
        subscriptionNotification: { notificationType: 2 },
      }),
    ],
  ])("flags %s as invalid payload", (_label, body) => {
    // Act
    const result = parsePlayPushBody(body, PACKAGE);

    // Assert
    expect(result).toMatchObject({ kind: "ignore", reason: "invalid_payload" });
  });
});

describe("decidePlayPlanChange", () => {
  it("renews the plan with the new Play expiry", () => {
    // Arrange
    const expiresAt = inDays(30);
    const input = makeInput({ snapshot: makeSnapshot({ expiresAt }) });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toEqual({ action: "activate", plan: "professional", expiresAt });
  });

  it("activates the Play plan for an account that is currently free", () => {
    // Arrange
    const input = makeInput({
      snapshot: makeSnapshot({ plan: "essential" }),
      currentProfile: { plan: "free", planExpiresAt: null },
    });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toMatchObject({ action: "activate", plan: "essential" });
  });

  it("does not shorten a paid plan that lasts longer than Play", () => {
    // Arrange
    const input = makeInput({
      snapshot: makeSnapshot({ expiresAt: inDays(5) }),
      currentProfile: { plan: "professional", planExpiresAt: inDays(300).toISOString() },
    });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toEqual({ action: "ignore", reason: "current_plan_outlasts_play" });
  });

  it("never touches a paid plan without a known expiry", () => {
    // Arrange
    const active = makeInput({
      currentProfile: { plan: "professional", planExpiresAt: null },
    });
    const inactive = makeInput({
      snapshot: makeSnapshot({ active: false, expiresAt: inDays(-1) }),
      currentProfile: { plan: "professional", planExpiresAt: null },
    });

    // Act
    const decisions = [decidePlayPlanChange(active), decidePlayPlanChange(inactive)];

    // Assert
    expect(decisions).toEqual([
      { action: "ignore", reason: "unknown_plan_source" },
      { action: "ignore", reason: "unknown_plan_source" },
    ]);
  });

  it("deactivates when the plan ends no later than the inactive Play purchase", () => {
    // Arrange
    const playExpiry = inDays(2);
    const input = makeInput({
      snapshot: makeSnapshot({ active: false, expiresAt: playExpiry }),
      currentProfile: { plan: "essential", planExpiresAt: playExpiry.toISOString() },
    });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toEqual({ action: "deactivate" });
  });

  it("keeps a newer plan from another channel when Play becomes inactive", () => {
    // Arrange
    const input = makeInput({
      snapshot: makeSnapshot({ active: false, expiresAt: inDays(-1) }),
      currentProfile: { plan: "professional", planExpiresAt: inDays(30).toISOString() },
    });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toEqual({ action: "ignore", reason: "current_plan_outlasts_play" });
  });

  it("never ends an Essential trial when a Play purchase is inactive", () => {
    // Arrange
    const input = makeInput({
      snapshot: makeSnapshot({ active: false, expiresAt: inDays(30) }),
      currentProfile: {
        plan: "essential",
        planExpiresAt: inDays(5).toISOString(),
        planIsTrial: true,
      },
    });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toEqual({ action: "ignore", reason: "trial_in_progress" });
  });

  it("activates a Play purchase even when the trial outlasts the Play expiry", () => {
    // Arrange
    const playExpiry = inDays(3);
    const input = makeInput({
      snapshot: makeSnapshot({ active: true, expiresAt: playExpiry }),
      currentProfile: {
        plan: "essential",
        planExpiresAt: inDays(6).toISOString(),
        planIsTrial: true,
      },
    });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toMatchObject({ action: "activate", expiresAt: playExpiry });
  });

  it("does nothing when the account is already free", () => {
    // Arrange
    const input = makeInput({
      snapshot: makeSnapshot({ active: false, expiresAt: inDays(-1) }),
      currentProfile: { plan: "free", planExpiresAt: null },
    });

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toEqual({ action: "ignore", reason: "already_free" });
  });

  it.each([
    ["token_not_found", { snapshot: null }],
    ["unknown_product", { snapshot: makeSnapshot({ plan: null }) }],
    ["no_owner", { snapshot: makeSnapshot({ purchaseOwnerId: null }) }],
    ["not_claimed", { claimedByOwner: false }],
    ["unknown_user", { currentProfile: null }],
  ] as const)("ignores with %s", (reason, overrides) => {
    // Arrange
    const input = makeInput(overrides);

    // Act
    const decision = decidePlayPlanChange(input);

    // Assert
    expect(decision).toEqual({ action: "ignore", reason });
  });
});
