import type { Recipe } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import type { AppDatabase } from "../../shared/db";
import { RecipesRepoPg } from "./recipes.repo.pg";

const data = {
  name: "Receita",
  category: "doces",
  yieldQuantity: 1,
  yieldUnit: "un",
  ingredients: [{ materialId: "material-other-user", quantity: 1, unit: "g" }],
};

describe("RecipesRepoPg ownership", () => {
  it.each(["create", "update"] as const)(
    "rejects foreign materials before any %s write",
    async (operation) => {
      const insert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: "own-recipe" }]),
        })),
      }));
      const update = vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      }));
      const remove = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
      const where = vi.fn().mockResolvedValue([]);
      const db = {
        select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
        insert,
        update,
        delete: remove,
      } as unknown as AppDatabase;
      const repo = new RecipesRepoPg(db);
      vi.spyOn(repo, "findById").mockResolvedValue({ id: "own-recipe" } as Recipe);
      const operationPromise =
        operation === "create"
          ? repo.create("user-a", data)
          : repo.update("user-a", "own-recipe", data);
      await expect(operationPromise).rejects.toThrow("Insumo não encontrado");
      const lookup = new PgDialect().sqlToQuery(where.mock.calls[0]![0]);
      expect(lookup.params).toEqual(["user-a", "material-other-user"]);
      expect(lookup.sql).toContain('"materials"."user_id"');
      expect(insert).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    },
  );

  it("accepts repeated uses of an owned material and scopes its lookup", async () => {
    const where = vi.fn().mockResolvedValue([{ id: "owned-material" }]);
    const values = vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: "own-recipe" }]),
    }));
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
      insert: vi.fn(() => ({ values })),
    } as unknown as AppDatabase;
    const repo = new RecipesRepoPg(db);
    const expected = { id: "own-recipe" } as Recipe;
    vi.spyOn(repo, "findById").mockResolvedValue(expected);
    const ingredient = { materialId: "owned-material", quantity: 1, unit: "g" };
    await expect(
      repo.create("user-a", {
        ...data,
        ingredients: [ingredient, ingredient],
      }),
    ).resolves.toBe(expected);
    expect(values).toHaveBeenCalledTimes(2);
    expect(new PgDialect().sqlToQuery(where.mock.calls[0]![0]).params).toEqual([
      "user-a",
      "owned-material",
    ]);
  });
});
