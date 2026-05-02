import type { UserProfile } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { SubscriptionUseCases } from "./subscription.usecases";
import type {
  ISubscriptionRepo,
  ResourceCounts,
  UpsertProfileData,
} from "./subscription.types";

const USER_ID = "user-abc";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: USER_ID,
    email: "maria@email.com",
    name: "Maria",
    phone: null,
    businessName: null,
    businessType: null,
    plan: "free",
    planExpiresAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<ISubscriptionRepo> = {}): ISubscriptionRepo {
  return {
    getProfile: () => Promise.resolve(makeProfile()),
    upsertProfile: (_userId: string, _data: UpsertProfileData) =>
      Promise.resolve(makeProfile()),
    updatePlan: (_userId: string, plan: "free" | "premium", expiresAt: Date | null) =>
      Promise.resolve(
        makeProfile({ plan, planExpiresAt: expiresAt?.toISOString() ?? null }),
      ),
    getResourceCounts: () =>
      Promise.resolve({
        salesThisMonth: 0,
        clients: 0,
        recipes: 0,
        packaging: 0,
      } as ResourceCounts),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<ISubscriptionRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new SubscriptionUseCases(repo);
  return { sut, repo };
}

describe("Webhook — SubscriptionUseCases integration", () => {
  describe("activatePremium", () => {
    it("sets plan to premium with expiration date", async () => {
      const updatePlan = vi.fn().mockResolvedValue(makeProfile({ plan: "premium" }));
      const { sut } = makeSut({ updatePlan });

      const expiresAt = new Date("2027-01-01T00:00:00.000Z");
      await sut.activatePremium(USER_ID, expiresAt);

      expect(updatePlan).toHaveBeenCalledWith(USER_ID, "premium", expiresAt);
    });

    it("sets plan to premium with null expiration", async () => {
      const updatePlan = vi.fn().mockResolvedValue(makeProfile({ plan: "premium" }));
      const { sut } = makeSut({ updatePlan });

      await sut.activatePremium(USER_ID, null);

      expect(updatePlan).toHaveBeenCalledWith(USER_ID, "premium", null);
    });

    it("throws NotFoundError when user does not exist", async () => {
      const { sut } = makeSut({
        updatePlan: () => Promise.resolve(null),
      });

      await expect(sut.activatePremium(USER_ID, null)).rejects.toThrow(
        "Perfil nao encontrado",
      );
    });
  });

  describe("deactivatePremium", () => {
    it("sets plan to free with null expiration", async () => {
      const updatePlan = vi.fn().mockResolvedValue(makeProfile({ plan: "free" }));
      const { sut } = makeSut({ updatePlan });

      await sut.deactivatePremium(USER_ID);

      expect(updatePlan).toHaveBeenCalledWith(USER_ID, "free", null);
    });

    it("throws NotFoundError when user does not exist", async () => {
      const { sut } = makeSut({
        updatePlan: () => Promise.resolve(null),
      });

      await expect(sut.deactivatePremium(USER_ID)).rejects.toThrow(
        "Perfil nao encontrado",
      );
    });
  });

  describe("isPremium", () => {
    it("returns true for active premium plan", async () => {
      const { sut } = makeSut({
        getProfile: () =>
          Promise.resolve(
            makeProfile({
              plan: "premium",
              planExpiresAt: new Date(Date.now() + 86400000).toISOString(),
            }),
          ),
      });

      expect(await sut.isPremium(USER_ID)).toBe(true);
    });

    it("returns false for free plan", async () => {
      const { sut } = makeSut();
      expect(await sut.isPremium(USER_ID)).toBe(false);
    });

    it("returns false for expired premium", async () => {
      const { sut } = makeSut({
        getProfile: () =>
          Promise.resolve(
            makeProfile({
              plan: "premium",
              planExpiresAt: new Date("2020-01-01").toISOString(),
            }),
          ),
      });

      expect(await sut.isPremium(USER_ID)).toBe(false);
    });

    it("returns false when user does not exist", async () => {
      const { sut } = makeSut({
        getProfile: () => Promise.resolve(null),
      });
      expect(await sut.isPremium(USER_ID)).toBe(false);
    });

    it("returns true for premium without expiration (lifetime)", async () => {
      const { sut } = makeSut({
        getProfile: () =>
          Promise.resolve(makeProfile({ plan: "premium", planExpiresAt: null })),
      });

      expect(await sut.isPremium(USER_ID)).toBe(true);
    });
  });
});
