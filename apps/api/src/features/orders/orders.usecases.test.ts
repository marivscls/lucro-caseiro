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

  describe("remove", () => {
    it("throws NotFoundError when missing", async () => {
      const { sut } = makeSut({ repo: { delete: () => Promise.resolve(false) } });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });
});
