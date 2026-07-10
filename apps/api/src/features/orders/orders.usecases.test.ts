import type { Order } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { OrdersUseCases } from "./orders.usecases";
import type { IIncomeRegistrar, IOrdersRepo } from "./orders.types";

const USER_ID = "user-123";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    userId: USER_ID,
    clientId: null,
    clientName: null,
    title: "Bolo de chocolate",
    deliveryDate: "2026-05-30",
    deliveryTime: null,
    status: "pending",
    amount: 80,
    deposit: null,
    theme: null,
    honoree: null,
    colors: null,
    photoUrl: null,
    notes: null,
    saleId: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IOrdersRepo> = {}): IOrdersRepo {
  return {
    create: (_userId, data) => Promise.resolve(makeOrder({ title: data.title })),
    findById: () => Promise.resolve(makeOrder()),
    findAll: () => Promise.resolve([makeOrder()]),
    update: (_userId, _id, data) => Promise.resolve(makeOrder({ ...data })),
    delete: () => Promise.resolve(true),
    summarize: () => Promise.resolve([]),
    ...overrides,
  };
}

function makeSut(opts: { repo?: Partial<IOrdersRepo> } = {}) {
  const repo = makeRepo(opts.repo);
  const createIncome = vi.fn(() => Promise.resolve({ id: "fin-1" }));
  const income: IIncomeRegistrar = { create: createIncome };
  const sut = new OrdersUseCases(repo, income);
  return { sut, repo, createIncome };
}

describe("OrdersUseCases", () => {
  describe("create", () => {
    it("creates a valid order", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        title: "Torta de limao",
        deliveryDate: "2026-05-30",
      });
      expect(result.title).toBe("Torta de limao");
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(sut.create(USER_ID, { title: "", deliveryDate: "x" })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("getById", () => {
    it("throws NotFoundError when missing", async () => {
      const { sut } = makeSut({ repo: { findById: () => Promise.resolve(null) } });
      await expect(sut.getById(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("deliver", () => {
    it("marks as done without registering income", async () => {
      const { sut, createIncome } = makeSut();
      const result = await sut.deliver(USER_ID, "order-1", { registerIncome: false });
      expect(result.status).toBe("done");
      expect(createIncome).not.toHaveBeenCalled();
    });

    it("registers income when requested", async () => {
      const { sut, createIncome } = makeSut();
      await sut.deliver(USER_ID, "order-1", { registerIncome: true });
      expect(createIncome).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ type: "income", category: "sale", amount: 80 }),
      );
    });

    it("is idempotent — does not re-register income if already done", async () => {
      const { sut, createIncome } = makeSut({
        repo: { findById: () => Promise.resolve(makeOrder({ status: "done" })) },
      });
      const result = await sut.deliver(USER_ID, "order-1", { registerIncome: true });
      expect(result.status).toBe("done");
      expect(createIncome).not.toHaveBeenCalled();
    });
  });

  describe("getSummary", () => {
    it("shapes the aggregate rows into a summary", async () => {
      const { sut } = makeSut({
        repo: {
          summarize: () =>
            Promise.resolve([
              { status: "pending", count: 2, amount: 100, deposit: 25 },
              { status: "done", count: 1, amount: 80, deposit: 30 },
              { status: "cancelled", count: 3, amount: 500, deposit: 100 },
            ]),
        },
      });

      const result = await sut.getSummary(USER_ID, {});

      expect(result.totalOrders).toBe(3);
      expect(result.totalAmount).toBe(180);
      expect(result.received).toBe(55);
      expect(result.toReceive).toBe(125);
    });

    it("forwards filter opts to the repo", async () => {
      const summarize = vi.fn(() => Promise.resolve([]));
      const { sut } = makeSut({ repo: { summarize } });

      await sut.getSummary(USER_ID, { status: "pending", startDate: "2026-05-01" });

      expect(summarize).toHaveBeenCalledWith(USER_ID, {
        status: "pending",
        startDate: "2026-05-01",
      });
    });
  });

  describe("remove", () => {
    it("throws NotFoundError when missing", async () => {
      const { sut } = makeSut({ repo: { delete: () => Promise.resolve(false) } });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });
});
