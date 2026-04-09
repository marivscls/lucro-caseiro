import type { Product } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { ProductsUseCases } from "./products.usecases";
import type { CreateProductData, IProductsRepo } from "./products.types";

const USER_ID = "user-123";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    userId: USER_ID,
    name: "Brigadeiro",
    description: null,
    category: "doces",
    photoUrl: null,
    salePrice: 3.5,
    costPrice: null,
    recipeId: null,
    stockQuantity: null,
    stockAlertThreshold: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IProductsRepo> = {}): IProductsRepo {
  return {
    create: (_userId: string, data: CreateProductData) =>
      Promise.resolve(makeProduct({ name: data.name, salePrice: data.salePrice })),
    findById: () => Promise.resolve(makeProduct()),
    findAll: () => Promise.resolve({ items: [makeProduct()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateProductData>) =>
      Promise.resolve(makeProduct({ ...data })),
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    decrementStock: () => Promise.resolve(),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IProductsRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new ProductsUseCases(repo);
  return { sut, repo };
}

describe("ProductsUseCases", () => {
  describe("create", () => {
    it("creates a product with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        name: "Brigadeiro",
        category: "doces",
        salePrice: 3.5,
      });

      expect(result.name).toBe("Brigadeiro");
      expect(result.salePrice).toBe(3.5);
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, { name: "", category: "doces", salePrice: -1 }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getById", () => {
    it("returns product when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "prod-1");
      expect(result.id).toBe("prod-1");
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
      const result = await sut.list(USER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("update", () => {
    it("updates a product with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "prod-1", {
        name: "Brigadeiro Gourmet",
      });

      expect(result.name).toBe("Brigadeiro Gourmet");
    });

    it("throws NotFoundError when product does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(sut.update(USER_ID, "prod-1", { salePrice: -5 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("remove", () => {
    it("removes an existing product", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "prod-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when product does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });
});
