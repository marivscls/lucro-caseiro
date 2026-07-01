import type { Supplier } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import type { CreateSupplierData, ISuppliersRepo } from "./suppliers.types";
import { SuppliersUseCases } from "./suppliers.usecases";

const USER_ID = "user-123";

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: "sup-1",
    userId: USER_ID,
    name: "Atacadão da Festa",
    phone: null,
    email: null,
    address: null,
    notes: null,
    createdAt: new Date("2026-01-01").toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<ISuppliersRepo> = {}): ISuppliersRepo {
  return {
    create: (_userId: string, data: CreateSupplierData) =>
      Promise.resolve(makeSupplier({ name: data.name })),
    findById: () => Promise.resolve(makeSupplier()),
    findDuplicate: () => Promise.resolve(null),
    findAll: () => Promise.resolve({ items: [makeSupplier()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateSupplierData>) =>
      Promise.resolve(makeSupplier({ ...data })),
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    ...overrides,
  };
}

describe("SuppliersUseCases", () => {
  describe("create", () => {
    it("creates a supplier with valid data", async () => {
      const sut = new SuppliersUseCases(makeRepo());
      const result = await sut.create(USER_ID, { name: "Atacadão da Festa" });
      expect(result.name).toBe("Atacadão da Festa");
    });

    it("throws ValidationError for an empty name", async () => {
      const sut = new SuppliersUseCases(makeRepo());
      await expect(sut.create(USER_ID, { name: "" })).rejects.toThrow(ValidationError);
    });

    it("rejects a duplicated supplier", async () => {
      const sut = new SuppliersUseCases(
        makeRepo({ findDuplicate: () => Promise.resolve(makeSupplier()) }),
      );

      await expect(sut.create(USER_ID, { name: "AtacadÃ£o da Festa" })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("getById", () => {
    it("returns the supplier when found", async () => {
      const sut = new SuppliersUseCases(makeRepo());
      const result = await sut.getById(USER_ID, "sup-1");
      expect(result.id).toBe("sup-1");
    });

    it("throws NotFoundError when missing", async () => {
      const sut = new SuppliersUseCases(
        makeRepo({ findById: () => Promise.resolve(null) }),
      );
      await expect(sut.getById(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("returns paginated items", async () => {
      const sut = new SuppliersUseCases(makeRepo());
      const result = await sut.list(USER_ID, { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("update", () => {
    it("updates an existing supplier", async () => {
      const sut = new SuppliersUseCases(makeRepo());
      const result = await sut.update(USER_ID, "sup-1", { name: "Novo nome" });
      expect(result.name).toBe("Novo nome");
    });

    it("throws NotFoundError when supplier is missing", async () => {
      const sut = new SuppliersUseCases(
        makeRepo({ findById: () => Promise.resolve(null) }),
      );
      await expect(sut.update(USER_ID, "nope", { name: "X" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError when the merged result is invalid", async () => {
      const sut = new SuppliersUseCases(makeRepo());
      await expect(sut.update(USER_ID, "sup-1", { name: "" })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("remove", () => {
    it("removes an existing supplier", async () => {
      const sut = new SuppliersUseCases(makeRepo());
      await expect(sut.remove(USER_ID, "sup-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when nothing was deleted", async () => {
      const sut = new SuppliersUseCases(
        makeRepo({ delete: () => Promise.resolve(false) }),
      );
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });
});
