import type { Client } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { ClientsUseCases } from "./clients.usecases";
import type { CreateClientData, IClientsRepo } from "./clients.types";

const USER_ID = "user-123";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-1",
    userId: USER_ID,
    name: "Maria Silva",
    phone: "11999887766",
    address: null,
    birthday: null,
    notes: null,
    tags: [],
    totalSpent: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IClientsRepo> = {}): IClientsRepo {
  return {
    create: (_userId: string, data: CreateClientData) =>
      Promise.resolve(makeClient({ name: data.name, phone: data.phone ?? null })),
    findById: () => Promise.resolve(makeClient()),
    findAll: () => Promise.resolve({ items: [makeClient()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateClientData>) =>
      Promise.resolve(makeClient({ ...data, phone: data.phone ?? null })),
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    findBirthdaysInMonth: () => Promise.resolve([makeClient({ birthday: "1990-03-15" })]),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IClientsRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new ClientsUseCases(repo);
  return { sut, repo };
}

describe("ClientsUseCases", () => {
  describe("create", () => {
    it("creates a client with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        name: "Maria Silva",
        phone: "11999887766",
      });

      expect(result.name).toBe("Maria Silva");
      expect(result.phone).toBe("11999887766");
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(sut.create(USER_ID, { name: "", phone: "123" })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("getById", () => {
    it("returns client when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "client-1");
      expect(result.id).toBe("client-1");
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
    it("updates a client with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "client-1", {
        name: "Maria Santos",
      });

      expect(result.name).toBe("Maria Santos");
    });

    it("throws NotFoundError when client does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(sut.update(USER_ID, "client-1", { name: "" })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("remove", () => {
    it("removes an existing client", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "client-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when client does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getBirthdaysThisMonth", () => {
    it("returns clients with birthdays in current month", async () => {
      const { sut } = makeSut();
      const result = await sut.getBirthdaysThisMonth(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0]!.birthday).toBe("1990-03-15");
    });

    it("returns empty array when no birthdays", async () => {
      const { sut } = makeSut({
        findBirthdaysInMonth: () => Promise.resolve([]),
      });
      const result = await sut.getBirthdaysThisMonth(USER_ID);
      expect(result).toEqual([]);
    });
  });
});
