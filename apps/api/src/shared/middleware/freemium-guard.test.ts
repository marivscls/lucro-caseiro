import type { PlanType, UserProfile } from "@lucro-caseiro/contracts";
import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { LimitExceededError } from "../errors";
import type {
  ISubscriptionRepo,
  ResourceCounts,
} from "../../features/subscription/subscription.types";
import { freemiumGuard } from "./freemium-guard";

const USER_ID = "user-123";

// O módulo real de auth carrega config/Supabase no import; aqui só importa o userId.
vi.mock("./auth", () => ({
  getUserId: (req: { userId: string }) => req.userId,
}));

function makeProfile(plan: PlanType): UserProfile {
  return {
    id: USER_ID,
    email: "maria@example.com",
    name: "Maria",
    phone: null,
    businessName: null,
    businessType: null,
    avatarUrl: null,
    plan,
    planExpiresAt: null,
    planIsTrial: false,
    createdAt: new Date().toISOString(),
  };
}

function makeCounts(overrides: Partial<ResourceCounts> = {}): ResourceCounts {
  return {
    salesThisMonth: 0,
    clients: 0,
    recipes: 0,
    packaging: 0,
    products: 0,
    suppliers: 0,
    ordersThisMonth: 0,
    ...overrides,
  };
}

function makeSut(plan: PlanType, counts: ResourceCounts) {
  const getResourceCounts = vi.fn(() => Promise.resolve(counts));
  const repo = {
    getProfile: () => Promise.resolve(makeProfile(plan)),
    getResourceCounts,
  } as unknown as ISubscriptionRepo;
  const guard = freemiumGuard(repo, "orders");
  const next = vi.fn<(err?: unknown) => void>();
  const req = { userId: USER_ID } as unknown as Request;
  return { guard, next, req, getResourceCounts };
}

describe("freemiumGuard('orders') — encomendas do mês (2026-11-15)", () => {
  it("lets a free user create the 5th order of the month", async () => {
    // Arrange
    const { guard, next, req } = makeSut("free", makeCounts({ ordersThisMonth: 4 }));

    // Act
    await guard(req, {} as Response, next as NextFunction);

    // Assert
    expect(next).toHaveBeenCalledWith();
  });

  it("blocks the 6th manual order on free with LIMIT_EXCEEDED", async () => {
    // Arrange
    const { guard, next, req } = makeSut("free", makeCounts({ ordersThisMonth: 5 }));

    // Act
    await guard(req, {} as Response, next as NextFunction);

    // Assert
    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(LimitExceededError);
    expect((error as Error).message).toContain("5 encomendas do mês");
    expect((error as Error).message).toContain("Premium");
  });

  it("never blocks orders on paid plans and skips the counts", async () => {
    for (const plan of ["essential", "professional"] as const) {
      // Arrange
      const { guard, next, req, getResourceCounts } = makeSut(
        plan,
        makeCounts({ ordersThisMonth: 9999 }),
      );

      // Act
      await guard(req, {} as Response, next as NextFunction);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(getResourceCounts).not.toHaveBeenCalled();
    }
  });
});
