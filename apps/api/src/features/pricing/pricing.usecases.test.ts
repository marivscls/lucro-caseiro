import type { Pricing } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { PricingUseCases } from "./pricing.usecases";
import type { CreatePricingData, IPricingRepo } from "./pricing.types";

const USER_ID = "user-123";

function makePricing(overrides: Partial<Pricing> = {}): Pricing {
  return {
    id: "price-1",
    userId: USER_ID,
    productId: null,
    ingredientCost: 10,
    packagingCost: 5,
    laborCost: 3,
    fixedCostShare: 2,
    totalCost: 20,
    marginPercent: 50,
    suggestedPrice: 30,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IPricingRepo> = {}): IPricingRepo {
  return {
    create: (_userId: string, data: CreatePricingData) =>
      Promise.resolve(
        makePricing({
          ingredientCost: data.ingredientCost,
          packagingCost: data.packagingCost,
          laborCost: data.laborCost,
          fixedCostShare: data.fixedCostShare,
          totalCost: data.totalCost,
          marginPercent: data.marginPercent,
          suggestedPrice: data.suggestedPrice,
        }),
      ),
    findById: () => Promise.resolve(makePricing()),
    findAll: () => Promise.resolve({ items: [makePricing()], total: 1 }),
    findByProduct: () => Promise.resolve([makePricing()]),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IPricingRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new PricingUseCases(repo);
  return { sut, repo };
}

describe("PricingUseCases", () => {
  describe("calculate", () => {
    it("creates a pricing record with computed values", async () => {
      const { sut } = makeSut();
      const result = await sut.calculate(USER_ID, {
        ingredientCost: 10,
        packagingCost: 5,
        laborCost: 3,
        fixedCostShare: 2,
        marginPercent: 50,
      });

      expect(result.totalCost).toBe(20);
      expect(result.suggestedPrice).toBe(30);
    });

    it("handles zero margin", async () => {
      const { sut } = makeSut();
      const result = await sut.calculate(USER_ID, {
        ingredientCost: 10,
        packagingCost: 5,
        laborCost: 3,
        fixedCostShare: 2,
        marginPercent: 0,
      });

      expect(result.totalCost).toBe(20);
      expect(result.suggestedPrice).toBe(20);
    });

    it("handles all costs zero", async () => {
      const { sut } = makeSut();
      const result = await sut.calculate(USER_ID, {
        ingredientCost: 0,
        packagingCost: 0,
        laborCost: 0,
        fixedCostShare: 0,
        marginPercent: 50,
      });

      expect(result.totalCost).toBe(0);
      expect(result.suggestedPrice).toBe(0);
    });

    it("throws ValidationError for negative costs", async () => {
      const { sut } = makeSut();
      await expect(
        sut.calculate(USER_ID, {
          ingredientCost: -1,
          packagingCost: 0,
          laborCost: 0,
          fixedCostShare: 0,
          marginPercent: 50,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("associates pricing with a product", async () => {
      const { sut } = makeSut();
      const result = await sut.calculate(USER_ID, {
        productId: "prod-1",
        ingredientCost: 10,
        packagingCost: 5,
        laborCost: 3,
        fixedCostShare: 2,
        marginPercent: 50,
      });

      expect(result.ingredientCost).toBe(10);
    });
  });

  describe("getById", () => {
    it("returns pricing when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "price-1");
      expect(result.id).toBe("price-1");
    });

    it("throws NotFoundError when not found", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.getById(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("returns paginated results", async () => {
      const { sut } = makeSut();
      const result = await sut.list(USER_ID, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getHistory", () => {
    it("returns pricing history for a product", async () => {
      const { sut } = makeSut();
      const result = await sut.getHistory(USER_ID, "prod-1");
      expect(result).toHaveLength(1);
    });

    it("returns empty array when no history", async () => {
      const { sut } = makeSut({
        findByProduct: () => Promise.resolve([]),
      });
      const result = await sut.getHistory(USER_ID, "prod-1");
      expect(result).toEqual([]);
    });
  });
});
