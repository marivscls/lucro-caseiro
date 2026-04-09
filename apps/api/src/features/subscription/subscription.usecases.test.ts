import type { UserProfile } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError } from "../../shared/errors";
import { SubscriptionUseCases } from "./subscription.usecases";
import type {
  ISubscriptionRepo,
  ResourceCounts,
  UpsertProfileData,
} from "./subscription.types";

const USER_ID = "user-123";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: USER_ID,
    email: "maria@email.com",
    name: "Maria",
    phone: null,
    businessName: "Doces da Maria",
    businessType: "food",
    plan: "free",
    planExpiresAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCounts(overrides: Partial<ResourceCounts> = {}): ResourceCounts {
  return {
    salesThisMonth: 10,
    clients: 5,
    recipes: 2,
    packaging: 1,
    ...overrides,
  };
}

function makeRepo(overrides: Partial<ISubscriptionRepo> = {}): ISubscriptionRepo {
  return {
    getProfile: () => Promise.resolve(makeProfile()),
    upsertProfile: (_userId: string, data: UpsertProfileData) =>
      Promise.resolve(makeProfile({ name: data.name })),
    updatePlan: (_userId: string, plan: "free" | "premium") =>
      Promise.resolve(makeProfile({ plan })),
    getResourceCounts: () => Promise.resolve(makeCounts()),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<ISubscriptionRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  return { sut: new SubscriptionUseCases(repo), repo };
}

describe("SubscriptionUseCases", () => {
  describe("getProfile", () => {
    it("returns profile when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getProfile(USER_ID);
      expect(result.name).toBe("Maria");
    });

    it("throws NotFoundError when not found", async () => {
      const { sut } = makeSut({ getProfile: () => Promise.resolve(null) });
      await expect(sut.getProfile(USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateProfile", () => {
    it("updates profile fields", async () => {
      const { sut } = makeSut();
      const result = await sut.updateProfile(USER_ID, { name: "Maria Silva" });
      expect(result.name).toBe("Maria Silva");
    });

    it("throws NotFoundError when profile not found", async () => {
      const { sut } = makeSut({ getProfile: () => Promise.resolve(null) });
      await expect(sut.updateProfile(USER_ID, { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getLimits", () => {
    it("returns limits with current counts for free user", async () => {
      const { sut } = makeSut();
      const result = await sut.getLimits(USER_ID);
      expect(result.maxSalesPerMonth).toBe(30);
      expect(result.currentSalesThisMonth).toBe(10);
      expect(result.currentClients).toBe(5);
    });

    it("returns infinite limits for premium user", async () => {
      const { sut } = makeSut({
        getProfile: () => Promise.resolve(makeProfile({ plan: "premium" })),
      });
      const result = await sut.getLimits(USER_ID);
      expect(result.maxSalesPerMonth).toBe(Infinity);
    });

    it("throws NotFoundError when profile not found", async () => {
      const { sut } = makeSut({ getProfile: () => Promise.resolve(null) });
      await expect(sut.getLimits(USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("isPremium", () => {
    it("returns false for free user", async () => {
      const { sut } = makeSut();
      expect(await sut.isPremium(USER_ID)).toBe(false);
    });

    it("returns true for premium user", async () => {
      const { sut } = makeSut({
        getProfile: () => Promise.resolve(makeProfile({ plan: "premium" })),
      });
      expect(await sut.isPremium(USER_ID)).toBe(true);
    });

    it("returns false for expired premium", async () => {
      const { sut } = makeSut({
        getProfile: () =>
          Promise.resolve(
            makeProfile({
              plan: "premium",
              planExpiresAt: new Date(Date.now() - 86400000).toISOString(),
            }),
          ),
      });
      expect(await sut.isPremium(USER_ID)).toBe(false);
    });

    it("returns false when profile not found", async () => {
      const { sut } = makeSut({ getProfile: () => Promise.resolve(null) });
      expect(await sut.isPremium(USER_ID)).toBe(false);
    });
  });

  describe("activatePremium", () => {
    it("activates premium plan", async () => {
      const { sut } = makeSut();
      const result = await sut.activatePremium(USER_ID, null);
      expect(result.plan).toBe("premium");
    });

    it("throws NotFoundError when profile not found", async () => {
      const { sut } = makeSut({ updatePlan: () => Promise.resolve(null) });
      await expect(sut.activatePremium(USER_ID, null)).rejects.toThrow(NotFoundError);
    });
  });

  describe("deactivatePremium", () => {
    it("deactivates to free plan", async () => {
      const { sut } = makeSut();
      const result = await sut.deactivatePremium(USER_ID);
      expect(result.plan).toBe("free");
    });
  });
});
