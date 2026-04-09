import type { Packaging } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { PackagingUseCases } from "./packaging.usecases";
import type { CreatePackagingData, IPackagingRepo } from "./packaging.types";

const USER_ID = "user-123";

function makePackaging(overrides: Partial<Packaging> = {}): Packaging {
  return {
    id: "pkg-1",
    userId: USER_ID,
    name: "Caixa Kraft",
    type: "box",
    unitCost: 1.5,
    supplier: null,
    photoUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IPackagingRepo> = {}): IPackagingRepo {
  return {
    create: (_userId: string, data: CreatePackagingData) =>
      Promise.resolve(makePackaging({ name: data.name, unitCost: data.unitCost })),
    findById: () => Promise.resolve(makePackaging()),
    findAll: () => Promise.resolve({ items: [makePackaging()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreatePackagingData>) =>
      Promise.resolve(makePackaging({ ...data })),
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    linkToProduct: () => Promise.resolve(),
    unlinkFromProduct: () => Promise.resolve(true),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IPackagingRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new PackagingUseCases(repo);
  return { sut, repo };
}

describe("PackagingUseCases", () => {
  describe("create", () => {
    it("creates a packaging with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        name: "Caixa Kraft",
        type: "box",
        unitCost: 1.5,
      });

      expect(result.name).toBe("Caixa Kraft");
      expect(result.unitCost).toBe(1.5);
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, { name: "", type: "box", unitCost: -1 }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getById", () => {
    it("returns packaging when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "pkg-1");
      expect(result.id).toBe("pkg-1");
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

  describe("update", () => {
    it("updates a packaging with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "pkg-1", {
        name: "Caixa Premium",
      });

      expect(result.name).toBe("Caixa Premium");
    });

    it("throws NotFoundError when packaging does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(sut.update(USER_ID, "pkg-1", { unitCost: -5 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("remove", () => {
    it("removes an existing packaging", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "pkg-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when packaging does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("linkToProduct", () => {
    it("links packaging to a product", async () => {
      const { sut } = makeSut();
      await expect(
        sut.linkToProduct(USER_ID, "pkg-1", "prod-1"),
      ).resolves.toBeUndefined();
    });

    it("throws NotFoundError when packaging does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.linkToProduct(USER_ID, "nope", "prod-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("unlinkFromProduct", () => {
    it("unlinks packaging from a product", async () => {
      const { sut } = makeSut();
      await expect(
        sut.unlinkFromProduct(USER_ID, "pkg-1", "prod-1"),
      ).resolves.toBeUndefined();
    });

    it("throws NotFoundError when packaging does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.unlinkFromProduct(USER_ID, "nope", "prod-1")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when link does not exist", async () => {
      const { sut } = makeSut({
        unlinkFromProduct: () => Promise.resolve(false),
      });
      await expect(sut.unlinkFromProduct(USER_ID, "pkg-1", "prod-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
