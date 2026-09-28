import type { UserProfile } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ServiceUnavailableError } from "../../shared/errors";
import { GooglePlayNotificationsUseCases } from "./google-play-rtdn.usecases";
import { hashPurchaseToken } from "./subscription.domain";
import type {
  GooglePlaySubscriptionSnapshot,
  IGooglePlaySubscriptionLookup,
  IPlanStateWriter,
  ISubscriptionRepo,
} from "./subscription.types";

const USER_ID = "user-123";
const TOKEN = "purchase-token";
const DAY = 86_400_000;

function inDays(days: number): Date {
  return new Date(Date.now() + days * DAY);
}

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: USER_ID,
    email: "maria@email.com",
    name: "Maria",
    phone: null,
    businessName: null,
    businessType: null,
    avatarUrl: null,
    plan: "professional",
    planExpiresAt: inDays(1).toISOString(),
    planIsTrial: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSnapshot(
  overrides: Partial<GooglePlaySubscriptionSnapshot> = {},
): GooglePlaySubscriptionSnapshot {
  return {
    plan: "professional",
    active: true,
    expiresAt: inDays(31),
    purchaseOwnerId: USER_ID,
    ...overrides,
  };
}

type Repo = Pick<ISubscriptionRepo, "getProfile" | "hasPurchaseClaim">;

function makeSut(
  options: {
    snapshot?: GooglePlaySubscriptionSnapshot | null;
    lookup?: IGooglePlaySubscriptionLookup["getSubscription"];
    repo?: Partial<Repo>;
    plans?: Partial<IPlanStateWriter>;
  } = {},
) {
  const snapshot = "snapshot" in options ? options.snapshot : makeSnapshot();
  const getSubscription = vi.fn(
    options.lookup ?? (() => Promise.resolve(snapshot ?? null)),
  );
  const getProfile = vi.fn(
    options.repo?.getProfile ?? (() => Promise.resolve(makeProfile())),
  );
  const hasPurchaseClaim = vi.fn(
    options.repo?.hasPurchaseClaim ?? (() => Promise.resolve(true)),
  );
  const activatePlan = vi.fn(
    options.plans?.activatePlan ?? (() => Promise.resolve(undefined)),
  );
  const deactivatePlan = vi.fn(
    options.plans?.deactivatePlan ?? (() => Promise.resolve(undefined)),
  );
  const sut = new GooglePlayNotificationsUseCases(
    { getProfile, hasPurchaseClaim },
    { getSubscription },
    { activatePlan, deactivatePlan },
  );
  return {
    sut,
    lookup: { getSubscription },
    repo: { getProfile, hasPurchaseClaim },
    plans: { activatePlan, deactivatePlan },
  };
}

describe("GooglePlayNotificationsUseCases.handleSubscriptionNotification", () => {
  it("renews the owner's plan with the new Play expiry", async () => {
    // Arrange
    const expiresAt = inDays(31);
    const { sut, plans, repo } = makeSut({ snapshot: makeSnapshot({ expiresAt }) });

    // Act
    const outcome = await sut.handleSubscriptionNotification(TOKEN);

    // Assert
    expect(repo.hasPurchaseClaim).toHaveBeenCalledWith(
      USER_ID,
      "google-play",
      hashPurchaseToken(TOKEN),
    );
    expect(plans.activatePlan).toHaveBeenCalledWith(USER_ID, "professional", expiresAt);
    expect(outcome).toEqual({
      decision: { action: "activate", plan: "professional", expiresAt },
      userId: USER_ID,
    });
  });

  it("gives the same result when Pub/Sub redelivers the notification", async () => {
    // Arrange
    const { sut, plans } = makeSut();

    // Act
    const first = await sut.handleSubscriptionNotification(TOKEN);
    const second = await sut.handleSubscriptionNotification(TOKEN);

    // Assert
    expect(second).toEqual(first);
    expect(plans.activatePlan).toHaveBeenNthCalledWith(
      2,
      ...plans.activatePlan.mock.calls[0]!,
    );
  });

  it("deactivates a Play plan that is no longer active", async () => {
    // Arrange
    const playExpiry = inDays(1);
    const { sut, plans } = makeSut({
      snapshot: makeSnapshot({ active: false, expiresAt: playExpiry }),
      repo: {
        getProfile: () =>
          Promise.resolve(makeProfile({ planExpiresAt: playExpiry.toISOString() })),
      },
    });

    // Act
    const outcome = await sut.handleSubscriptionNotification(TOKEN);

    // Assert
    expect(plans.deactivatePlan).toHaveBeenCalledWith(USER_ID);
    expect(outcome.decision).toEqual({ action: "deactivate" });
  });

  it("never grants a plan for a token the owner did not sync from the app", async () => {
    // Arrange
    const { sut, plans, repo } = makeSut({
      repo: { hasPurchaseClaim: () => Promise.resolve(false) },
    });

    // Act
    const outcome = await sut.handleSubscriptionNotification(TOKEN);

    // Assert
    expect(outcome.decision).toEqual({ action: "ignore", reason: "not_claimed" });
    expect(repo.getProfile).not.toHaveBeenCalled();
    expect(plans.activatePlan).not.toHaveBeenCalled();
  });

  it("keeps a newer plan from another channel when Play expires", async () => {
    // Arrange
    const { sut, plans } = makeSut({
      snapshot: makeSnapshot({ active: false, expiresAt: inDays(-1) }),
      repo: {
        getProfile: () =>
          Promise.resolve(makeProfile({ planExpiresAt: inDays(20).toISOString() })),
      },
    });

    // Act
    const outcome = await sut.handleSubscriptionNotification(TOKEN);

    // Assert
    expect(outcome.decision).toEqual({
      action: "ignore",
      reason: "current_plan_outlasts_play",
    });
    expect(plans.deactivatePlan).not.toHaveBeenCalled();
  });

  it("ignores a token Google no longer knows", async () => {
    // Arrange
    const { sut, repo, plans } = makeSut({ snapshot: null });

    // Act
    const outcome = await sut.handleSubscriptionNotification(TOKEN);

    // Assert
    expect(outcome).toEqual({
      decision: { action: "ignore", reason: "token_not_found" },
      userId: null,
    });
    expect(repo.hasPurchaseClaim).not.toHaveBeenCalled();
    expect(plans.activatePlan).not.toHaveBeenCalled();
  });

  it("treats an account deleted mid-flight as ignored", async () => {
    // Arrange
    const { sut } = makeSut({
      plans: {
        activatePlan: () => Promise.reject(new NotFoundError("Perfil não encontrado")),
      },
    });

    // Act
    const outcome = await sut.handleSubscriptionNotification(TOKEN);

    // Assert
    expect(outcome.decision).toEqual({ action: "ignore", reason: "unknown_user" });
  });

  it("propagates transient Google failures so Pub/Sub retries", async () => {
    // Arrange
    const { sut } = makeSut({
      lookup: () => Promise.reject(new ServiceUnavailableError("indisponivel")),
    });

    // Act
    const act = sut.handleSubscriptionNotification(TOKEN);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});
