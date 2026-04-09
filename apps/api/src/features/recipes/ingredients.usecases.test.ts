import type { Ingredient } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { IngredientsUseCases } from "./ingredients.usecases";
import type { CreateIngredientData, IIngredientsRepo } from "./ingredients.types";

const USER_ID = "user-123";

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: "ing-1",
    userId: USER_ID,
    name: "Leite Condensado",
    price: 7.5,
    quantityPerPackage: 395,
    unit: "g",
    supplier: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IIngredientsRepo> = {}): IIngredientsRepo {
  return {
    create: (_userId: string, data: CreateIngredientData) =>
      Promise.resolve(makeIngredient({ name: data.name, price: data.price })),
    findById: () => Promise.resolve(makeIngredient()),
    findAll: () => Promise.resolve({ items: [makeIngredient()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateIngredientData>) =>
      Promise.resolve(makeIngredient({ ...data })),
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IIngredientsRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new IngredientsUseCases(repo);
  return { sut, repo };
}

describe("IngredientsUseCases", () => {
  describe("create", () => {
    it("creates an ingredient with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        name: "Leite Condensado",
        price: 7.5,
        quantityPerPackage: 395,
        unit: "g",
      });

      expect(result.name).toBe("Leite Condensado");
      expect(result.price).toBe(7.5);
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, { name: "", price: -1, quantityPerPackage: 0, unit: "" }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getById", () => {
    it("returns ingredient when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "ing-1");
      expect(result.id).toBe("ing-1");
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
    it("updates an ingredient with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "ing-1", {
        name: "Leite Condensado Moca",
      });

      expect(result.name).toBe("Leite Condensado Moca");
    });

    it("throws NotFoundError when ingredient does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(sut.update(USER_ID, "ing-1", { price: -5 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("remove", () => {
    it("removes an existing ingredient", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "ing-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when ingredient does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });
});
