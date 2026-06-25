import type { Material } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { MaterialsUseCases } from "./materials.usecases";
import type { CreateMaterialData, IMaterialsRepo } from "./materials.types";

const USER_ID = "user-123";

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: "mat-1",
    userId: USER_ID,
    name: "Farinha",
    unit: "kg",
    stockQuantity: 10,
    stockAlertThreshold: 3,
    costPerUnit: 5,
    contentPerUnit: null,
    contentUnit: null,
    notes: null,
    icon: null,
    supplierId: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IMaterialsRepo> = {}): IMaterialsRepo {
  return {
    create: (_userId: string, data: CreateMaterialData) =>
      Promise.resolve(makeMaterial({ name: data.name, unit: data.unit })),
    findById: () => Promise.resolve(makeMaterial()),
    findAll: () => Promise.resolve({ items: [makeMaterial()], total: 1 }),
    findLowStock: () => Promise.resolve([makeMaterial({ stockQuantity: 2 })]),
    update: (_userId: string, _id: string, data) =>
      Promise.resolve(makeMaterial({ ...data })),
    adjustStock: (_userId: string, _id: string, delta: number) =>
      Promise.resolve(makeMaterial({ stockQuantity: 10 + delta })),
    delete: () => Promise.resolve(true),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IMaterialsRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new MaterialsUseCases(repo);
  return { sut, repo };
}

describe("MaterialsUseCases", () => {
  it("creates a valid material", async () => {
    const { sut } = makeSut();
    const result = await sut.create(USER_ID, { name: "Açúcar", unit: "kg" });
    expect(result.name).toBe("Açúcar");
  });

  it("throws ValidationError on invalid create", async () => {
    const { sut } = makeSut();
    await expect(sut.create(USER_ID, { name: "", unit: "" })).rejects.toThrow(
      ValidationError,
    );
  });

  it("throws NotFoundError when material is missing", async () => {
    const { sut } = makeSut({ findById: () => Promise.resolve(null) });
    await expect(sut.getById(USER_ID, "nope")).rejects.toThrow(NotFoundError);
  });

  it("lists paginated", async () => {
    const { sut } = makeSut();
    const result = await sut.list(USER_ID, { page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("returns low-stock materials", async () => {
    const { sut } = makeSut();
    const result = await sut.lowStock(USER_ID);
    expect(result[0]!.stockQuantity).toBe(2);
  });

  it("adjusts stock", async () => {
    const { sut } = makeSut();
    const result = await sut.adjust(USER_ID, "mat-1", -4);
    expect(result.stockQuantity).toBe(6);
  });

  it("throws NotFoundError adjusting a missing material", async () => {
    const { sut } = makeSut({ adjustStock: () => Promise.resolve(null) });
    await expect(sut.adjust(USER_ID, "nope", 1)).rejects.toThrow(NotFoundError);
  });
});
