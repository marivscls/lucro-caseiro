import type { PlanType, UserProfile } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError } from "../../shared/errors";
import { SubscriptionUseCases } from "./subscription.usecases";
import type {
  ISubscriptionRepo,
  ISubscriptionStatusProvider,
  ResourceCounts,
  UpsertProfileData,
} from "./subscription.types";

const USER_ID = "user-123";
const ANDROID_PURCHASE = {
  productId: "lucrocaseiro_professional_monthly",
  purchaseToken: "purchase-token",
};

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: USER_ID,
    email: "maria@email.com",
    name: "Maria",
    phone: null,
    businessName: "Doces da Maria",
    businessType: "food",
    avatarUrl: null,
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
    products: 8,
    suppliers: 1,
    ...overrides,
  };
}

function makeRepo(overrides: Partial<ISubscriptionRepo> = {}): ISubscriptionRepo {
  return {
    getProfile: () => Promise.resolve(makeProfile()),
    upsertProfile: (_userId: string, data: UpsertProfileData) =>
      Promise.resolve(makeProfile({ name: data.name })),
    updatePlan: (_userId: string, plan: PlanType, expiresAt: Date | null) =>
      Promise.resolve(
        makeProfile({ plan, planExpiresAt: expiresAt?.toISOString() ?? null }),
      ),
    getResourceCounts: () => Promise.resolve(makeCounts()),
    ...overrides,
  };
}

function makeStatusProvider(
  overrides: Partial<ISubscriptionStatusProvider> = {},
): ISubscriptionStatusProvider {
  return {
    getPlanState: () => Promise.resolve({ plan: "professional", expiresAt: null }),
    ...overrides,
  };
}

function makeSut(
  repoOverrides: Partial<ISubscriptionRepo> = {},
  statusProvider?: ISubscriptionStatusProvider,
) {
  const repo = makeRepo(repoOverrides);
  return { sut: new SubscriptionUseCases(repo, statusProvider), repo };
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

    it("returns null volume limits for essential but keeps suppliers capped", async () => {
      const { sut } = makeSut({
        getProfile: () => Promise.resolve(makeProfile({ plan: "essential" })),
      });
      const result = await sut.getLimits(USER_ID);
      expect(result.maxSalesPerMonth).toBeNull();
      expect(result.maxSuppliers).toBe(3);
    });

    it("returns null limits for professional user", async () => {
      const { sut } = makeSut({
        getProfile: () => Promise.resolve(makeProfile({ plan: "professional" })),
      });
      const result = await sut.getLimits(USER_ID);
      expect(result.maxSalesPerMonth).toBeNull();
      expect(result.maxSuppliers).toBeNull();
    });

    it("treats legacy premium as professional (unlimited)", async () => {
      const { sut } = makeSut({
        // Simula um valor legado vindo do banco (fora do tipo PlanType atual).
        getProfile: () =>
          Promise.resolve(makeProfile({ plan: "premium" as unknown as PlanType })),
      });
      const result = await sut.getLimits(USER_ID);
      expect(result.maxSalesPerMonth).toBeNull();
      expect(result.maxSuppliers).toBeNull();
    });

    it("throws NotFoundError when profile not found", async () => {
      const { sut } = makeSut({ getProfile: () => Promise.resolve(null) });
      await expect(sut.getLimits(USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getActivePlan", () => {
    it("returns free for free user", async () => {
      const { sut } = makeSut();
      expect(await sut.getActivePlan(USER_ID)).toBe("free");
    });

    it("returns the paid plan for an active subscriber", async () => {
      const { sut } = makeSut({
        getProfile: () => Promise.resolve(makeProfile({ plan: "essential" })),
      });
      expect(await sut.getActivePlan(USER_ID)).toBe("essential");
    });

    it("normalizes legacy premium to professional", async () => {
      const { sut } = makeSut({
        getProfile: () =>
          Promise.resolve(makeProfile({ plan: "premium" as unknown as PlanType })),
      });
      expect(await sut.getActivePlan(USER_ID)).toBe("professional");
    });

    it("falls back to free for an expired paid plan", async () => {
      const { sut } = makeSut({
        getProfile: () =>
          Promise.resolve(
            makeProfile({
              plan: "professional",
              planExpiresAt: new Date(Date.now() - 86400000).toISOString(),
            }),
          ),
      });
      expect(await sut.getActivePlan(USER_ID)).toBe("free");
    });

    it("returns free when profile not found", async () => {
      const { sut } = makeSut({ getProfile: () => Promise.resolve(null) });
      expect(await sut.getActivePlan(USER_ID)).toBe("free");
    });
  });

  describe("activatePlan", () => {
    it("activates the given paid plan", async () => {
      const { sut } = makeSut();
      const result = await sut.activatePlan(USER_ID, "essential", null);
      expect(result.plan).toBe("essential");
    });

    it("activates professional", async () => {
      const { sut } = makeSut();
      const result = await sut.activatePlan(USER_ID, "professional", null);
      expect(result.plan).toBe("professional");
    });

    it("throws NotFoundError when profile not found", async () => {
      const { sut } = makeSut({ updatePlan: () => Promise.resolve(null) });
      await expect(sut.activatePlan(USER_ID, "professional", null)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("deactivatePlan", () => {
    it("deactivates to free plan", async () => {
      const { sut } = makeSut();
      const result = await sut.deactivatePlan(USER_ID);
      expect(result.plan).toBe("free");
    });

    it("throws NotFoundError when profile not found", async () => {
      const { sut } = makeSut({ updatePlan: () => Promise.resolve(null) });
      await expect(sut.deactivatePlan(USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("syncPlanFromProvider", () => {
    it("activates the plan the provider confirms as active", async () => {
      const { sut } = makeSut({}, makeStatusProvider());
      const result = await sut.syncPlanFromProvider(USER_ID, ANDROID_PURCHASE);
      expect(result.plan).toBe("professional");
    });

    it("activates essential when the provider reports essential", async () => {
      const { sut } = makeSut(
        {},
        makeStatusProvider({
          getPlanState: () => Promise.resolve({ plan: "essential", expiresAt: null }),
        }),
      );
      const result = await sut.syncPlanFromProvider(USER_ID, ANDROID_PURCHASE);
      expect(result.plan).toBe("essential");
    });

    it("keeps current profile when provider does not confirm active subscription", async () => {
      const { sut } = makeSut(
        {
          getProfile: () => Promise.resolve(makeProfile({ plan: "professional" })),
        },
        makeStatusProvider({
          getPlanState: () => Promise.resolve({ plan: "free", expiresAt: null }),
        }),
      );
      const result = await sut.syncPlanFromProvider(USER_ID, ANDROID_PURCHASE);
      expect(result.plan).toBe("professional");
    });

    it("does not sync when provider is not configured", async () => {
      const { sut } = makeSut();
      await expect(sut.syncPlanFromProvider(USER_ID, ANDROID_PURCHASE)).rejects.toThrow(
        "Verificacao de assinatura Android não configurada",
      );
    });
  });
});
