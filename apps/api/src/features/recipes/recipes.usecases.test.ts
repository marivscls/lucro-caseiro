import type { Recipe } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { RecipesUseCases } from "./recipes.usecases";
import type { CreateRecipeData, IRecipesRepo } from "./recipes.types";

const USER_ID = "user-123";

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    userId: USER_ID,
    name: "Brigadeiro",
    category: "doces",
    instructions: null,
    yieldQuantity: 30,
    yieldUnit: "unidades",
    photoUrl: null,
    totalCost: 7.5,
    costPerUnit: 0.25,
    ingredients: [
      {
        ingredientId: "ing-1",
        quantity: 395,
        unit: "g",
        ingredientName: "Leite Condensado",
        ingredientPrice: 7.5,
        cost: 7.5,
      },
    ],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IRecipesRepo> = {}): IRecipesRepo {
  return {
    create: (_userId: string, data: CreateRecipeData) =>
      Promise.resolve(makeRecipe({ name: data.name })),
    findById: () => Promise.resolve(makeRecipe()),
    findAll: () => Promise.resolve({ items: [makeRecipe()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateRecipeData>) =>
      Promise.resolve(makeRecipe({ ...data, ingredients: undefined })),
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IRecipesRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new RecipesUseCases(repo);
  return { sut, repo };
}

describe("RecipesUseCases", () => {
  describe("create", () => {
    it("creates a recipe with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        name: "Brigadeiro",
        category: "doces",
        yieldQuantity: 30,
        yieldUnit: "unidades",
        ingredients: [{ ingredientId: "ing-1", quantity: 395, unit: "g" }],
      });

      expect(result.name).toBe("Brigadeiro");
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, {
          name: "",
          category: "",
          yieldQuantity: 0,
          yieldUnit: "",
          ingredients: [],
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getById", () => {
    it("returns recipe when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "recipe-1");
      expect(result.id).toBe("recipe-1");
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
    it("updates a recipe with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "recipe-1", {
        name: "Brigadeiro Gourmet",
      });

      expect(result.name).toBe("Brigadeiro Gourmet");
    });

    it("throws NotFoundError when recipe does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(
        sut.update(USER_ID, "recipe-1", { yieldQuantity: -5 }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("remove", () => {
    it("removes an existing recipe", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "recipe-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when recipe does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("scale", () => {
    it("scales recipe ingredients by multiplier", async () => {
      const { sut } = makeSut();
      const result = await sut.scale(USER_ID, "recipe-1", 2);

      expect(result.ingredients[0]!.quantity).toBe(790);
      expect(result.yieldQuantity).toBe(60);
    });

    it("handles fractional multipliers", async () => {
      const { sut } = makeSut();
      const result = await sut.scale(USER_ID, "recipe-1", 0.5);

      expect(result.ingredients[0]!.quantity).toBe(197.5);
      expect(result.yieldQuantity).toBe(15);
    });

    it("throws NotFoundError when recipe does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.scale(USER_ID, "nope", 2)).rejects.toThrow(NotFoundError);
    });
  });
});
