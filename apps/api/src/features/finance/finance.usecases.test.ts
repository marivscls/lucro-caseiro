import type { FinanceEntry } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { FinanceUseCases } from "./finance.usecases";
import type { CreateFinanceEntryData, IFinanceRepo } from "./finance.types";

const USER_ID = "user-123";

function makeEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id: "entry-1",
    userId: USER_ID,
    type: "expense",
    category: "material",
    amount: 50,
    description: "Compra de farinha",
    saleId: null,
    date: "2026-03-15",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IFinanceRepo> = {}): IFinanceRepo {
  return {
    create: (_userId: string, data: CreateFinanceEntryData) =>
      Promise.resolve(
        makeEntry({
          type: data.type,
          amount: data.amount,
          description: data.description,
        }),
      ),
    findById: () => Promise.resolve(makeEntry()),
    findAll: () => Promise.resolve({ items: [makeEntry()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateFinanceEntryData>) =>
      Promise.resolve(makeEntry({ ...data })),
    delete: () => Promise.resolve(true),
    getSummary: () =>
      Promise.resolve({ totalIncome: 1000, totalExpenses: 600, profit: 400 }),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IFinanceRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new FinanceUseCases(repo);
  return { sut, repo };
}

describe("FinanceUseCases", () => {
  describe("create", () => {
    it("creates an entry with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        type: "expense",
        category: "material",
        amount: 50,
        description: "Compra de farinha",
        date: "2026-03-15",
      });

      expect(result.amount).toBe(50);
      expect(result.description).toBe("Compra de farinha");
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, {
          type: "expense",
          category: "material",
          amount: -10,
          description: "",
          date: "invalid",
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getById", () => {
    it("returns entry when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "entry-1");
      expect(result.id).toBe("entry-1");
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
    it("updates an entry with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "entry-1", {
        amount: 75,
      });

      expect(result.amount).toBe(75);
    });

    it("throws NotFoundError when entry does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { amount: 75 })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(sut.update(USER_ID, "entry-1", { amount: -5 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("remove", () => {
    it("removes an existing entry", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "entry-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when entry does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getMonthlySummary", () => {
    it("returns summary for a given month", async () => {
      const { sut } = makeSut();
      const result = await sut.getMonthlySummary(USER_ID, 3, 2026);

      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpenses).toBe(600);
      expect(result.profit).toBe(400);
      expect(result.period).toBe("2026-03");
    });

    it("calls repo with correct date range", async () => {
      let capturedStart = "";
      let capturedEnd = "";

      const { sut } = makeSut({
        getSummary: (_userId: string, startDate: string, endDate: string) => {
          capturedStart = startDate;
          capturedEnd = endDate;
          return Promise.resolve({ totalIncome: 0, totalExpenses: 0, profit: 0 });
        },
      });

      await sut.getMonthlySummary(USER_ID, 2, 2026);

      expect(capturedStart).toBe("2026-02-01");
      expect(capturedEnd).toBe("2026-02-28");
    });
  });

  describe("createFromSale", () => {
    it("creates an income entry linked to a sale", async () => {
      let capturedData: CreateFinanceEntryData | null = null;

      const { sut } = makeSut({
        create: (_userId: string, data: CreateFinanceEntryData) => {
          capturedData = data;
          return Promise.resolve(
            makeEntry({
              type: "income",
              category: "sale",
              amount: data.amount,
              saleId: data.saleId ?? null,
            }),
          );
        },
      });

      const result = await sut.createFromSale(
        USER_ID,
        "sale-1",
        150,
        "Venda de brigadeiros",
        "2026-03-15",
      );

      expect(result.type).toBe("income");
      expect(result.category).toBe("sale");
      expect(result.amount).toBe(150);
      expect(result.saleId).toBe("sale-1");
      expect(capturedData!.type).toBe("income");
      expect(capturedData!.saleId).toBe("sale-1");
    });
  });
});
