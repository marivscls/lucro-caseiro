import type { FinanceEntry, RecurringExpense } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { FinanceUseCases } from "./finance.usecases";
import type { CreateFinanceEntryData, IFinanceRepo } from "./finance.types";

const USER_ID = "user-123";

function makeRecurring(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: "rec-1",
    userId: USER_ID,
    category: "utility",
    amount: 800,
    description: "Aluguel",
    dayOfMonth: 5,
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id: "entry-1",
    userId: USER_ID,
    type: "expense",
    category: "material",
    amount: 50,
    description: "Compra de farinha",
    isFixed: false,
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
          isFixed: data.isFixed ?? false,
        }),
      ),
    findById: () => Promise.resolve(makeEntry()),
    findAll: () => Promise.resolve({ items: [makeEntry()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateFinanceEntryData>) =>
      Promise.resolve(makeEntry({ ...data })),
    delete: () => Promise.resolve(true),
    findBySaleId: () => Promise.resolve(null),
    deleteBySaleId: () => Promise.resolve(true),
    getSummary: () =>
      Promise.resolve({
        totalIncome: 1000,
        totalExpenses: 600,
        fixedExpenses: 200,
        variableExpenses: 400,
        profit: 400,
      }),
    createRecurring: (_userId, data) => Promise.resolve(makeRecurring({ ...data })),
    findAllRecurring: () => Promise.resolve([makeRecurring()]),
    findRecurringById: () => Promise.resolve(makeRecurring()),
    updateRecurring: (_userId, _id, data) => Promise.resolve(makeRecurring({ ...data })),
    deleteRecurring: () => Promise.resolve(true),
    findActiveRecurring: () => Promise.resolve([]),
    findGeneratedRecurringIds: () => Promise.resolve([]),
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

    it("defaults isFixed to false when absent", async () => {
      let captured: CreateFinanceEntryData | null = null;
      const { sut } = makeSut({
        create: (_userId: string, data: CreateFinanceEntryData) => {
          captured = data;
          return Promise.resolve(makeEntry({ isFixed: data.isFixed ?? false }));
        },
      });

      const result = await sut.create(USER_ID, {
        type: "expense",
        category: "material",
        amount: 50,
        description: "Compra de farinha",
        date: "2026-03-15",
      });

      expect(result.isFixed).toBe(false);
      expect(captured!.isFixed).toBeUndefined();
    });

    it("persists isFixed=true for a fixed expense", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        type: "expense",
        category: "utility",
        amount: 120,
        description: "Aluguel",
        date: "2026-03-15",
        isFixed: true,
      });

      expect(result.isFixed).toBe(true);
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
      expect(result.fixedExpenses).toBe(200);
      expect(result.variableExpenses).toBe(400);
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
          return Promise.resolve({
            totalIncome: 0,
            totalExpenses: 0,
            fixedExpenses: 0,
            variableExpenses: 0,
            profit: 0,
          });
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

  describe("gastos recorrentes", () => {
    it("cria recorrência com dados válidos", async () => {
      const { sut } = makeSut();
      const result = await sut.createRecurring(USER_ID, {
        category: "utility",
        amount: 800,
        description: "Aluguel",
        dayOfMonth: 5,
      });
      expect(result.amount).toBe(800);
      expect(result.dayOfMonth).toBe(5);
    });

    it("rejeita recorrência com dia inválido", async () => {
      const { sut } = makeSut();
      await expect(
        sut.createRecurring(USER_ID, {
          category: "utility",
          amount: 800,
          description: "Aluguel",
          dayOfMonth: 31,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("applyDueRecurring gera um lançamento por recorrência ativa não gerada", async () => {
      const created: CreateFinanceEntryData[] = [];
      const { sut } = makeSut({
        findActiveRecurring: () =>
          Promise.resolve([makeRecurring({ id: "rec-1", dayOfMonth: 5 })]),
        findGeneratedRecurringIds: () => Promise.resolve([]),
        create: (_userId, data) => {
          created.push(data);
          return Promise.resolve(makeEntry({ ...data }));
        },
      });

      await sut.applyDueRecurring(USER_ID, 2026, 6);

      expect(created).toHaveLength(1);
      expect(created[0]).toMatchObject({
        type: "expense",
        category: "utility",
        amount: 800,
        isFixed: true,
        recurringExpenseId: "rec-1",
        date: "2026-06-05",
      });
    });

    it("applyDueRecurring pula recorrências já geradas no mês (idempotente)", async () => {
      const created: CreateFinanceEntryData[] = [];
      const { sut } = makeSut({
        findActiveRecurring: () => Promise.resolve([makeRecurring({ id: "rec-1" })]),
        findGeneratedRecurringIds: () => Promise.resolve(["rec-1"]),
        create: (_userId, data) => {
          created.push(data);
          return Promise.resolve(makeEntry({ ...data }));
        },
      });

      await sut.applyDueRecurring(USER_ID, 2026, 6);

      expect(created).toHaveLength(0);
    });

    it("applyDueRecurring não faz nada sem recorrências ativas", async () => {
      let createCalls = 0;
      const { sut } = makeSut({
        findActiveRecurring: () => Promise.resolve([]),
        create: (_userId, data) => {
          createCalls += 1;
          return Promise.resolve(makeEntry({ ...data }));
        },
      });

      await sut.applyDueRecurring(USER_ID, 2026, 6);

      expect(createCalls).toBe(0);
    });
  });
});
