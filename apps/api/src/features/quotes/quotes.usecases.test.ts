import type { Quote } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import type { IOrderCreator, IQuotesRepo } from "./quotes.types";
import { QuotesUseCases } from "./quotes.usecases";

const USER_ID = "user-123";

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "quote-1",
    userId: USER_ID,
    clientId: null,
    clientName: "Joana",
    title: "Kit Safari",
    items: [{ description: "Convite", quantity: 30, unitPrice: 2 }],
    total: 60,
    status: "pending",
    validUntil: null,
    notes: null,
    orderId: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IQuotesRepo> = {}): IQuotesRepo {
  return {
    create: (_userId, data) =>
      Promise.resolve(makeQuote({ title: data.title, total: data.total })),
    findById: () => Promise.resolve(makeQuote()),
    findAll: () => Promise.resolve({ items: [makeQuote()], total: 1 }),
    update: (_userId, _id, data) => Promise.resolve(makeQuote(data as Partial<Quote>)),
    delete: () => Promise.resolve(true),
    ...overrides,
  };
}

function makeSut(
  repoOverrides: Partial<IQuotesRepo> = {},
  orderCreator: IOrderCreator = { create: () => Promise.resolve({ id: "order-9" }) },
) {
  const repo = makeRepo(repoOverrides);
  const sut = new QuotesUseCases(repo, orderCreator);
  return { sut, repo, orderCreator };
}

describe("QuotesUseCases.create", () => {
  it("calcula o total a partir dos itens", async () => {
    const { sut } = makeSut();
    const quote = await sut.create(USER_ID, {
      title: "Kit Safari",
      items: [
        { description: "Convite", quantity: 30, unitPrice: 2 },
        { description: "Topo", quantity: 1, unitPrice: 35 },
      ],
    });
    expect(quote.total).toBe(95);
  });

  it("rejeita orçamento sem itens", async () => {
    const { sut } = makeSut();
    await expect(sut.create(USER_ID, { title: "Kit", items: [] })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("QuotesUseCases.update", () => {
  it("bloqueia edição de orçamento aprovado", async () => {
    const { sut } = makeSut({
      findById: () => Promise.resolve(makeQuote({ status: "accepted" })),
    });
    await expect(
      sut.update(USER_ID, "quote-1", { title: "Novo" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("recalcula o total quando itens mudam", async () => {
    const { sut } = makeSut();
    const quote = await sut.update(USER_ID, "quote-1", {
      items: [{ description: "Tag", quantity: 10, unitPrice: 1.5 }],
    });
    expect(quote.total).toBe(15);
  });
});

describe("QuotesUseCases.convertToOrder", () => {
  it("cria encomenda com total, sinal e resumo dos itens", async () => {
    const createOrder = vi.fn(() => Promise.resolve({ id: "order-9" }));
    const update = vi.fn((_u: string, _i: string, data: object) =>
      Promise.resolve(makeQuote(data as Partial<Quote>)),
    );
    const { sut } = makeSut({ update }, { create: createOrder });

    const quote = await sut.convertToOrder(USER_ID, "quote-1", {
      deliveryDate: "2026-07-10",
      deposit: 30,
    });

    expect(createOrder).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        title: "Kit Safari",
        deliveryDate: "2026-07-10",
        amount: 60,
        deposit: 30,
        notes: expect.stringContaining("30x Convite"),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      USER_ID,
      "quote-1",
      expect.objectContaining({ status: "accepted", orderId: "order-9" }),
    );
    expect(quote.status).toBe("accepted");
  });

  it("rejeita conversão dupla", async () => {
    const { sut } = makeSut({
      findById: () => Promise.resolve(makeQuote({ orderId: "order-1" })),
    });
    await expect(
      sut.convertToOrder(USER_ID, "quote-1", { deliveryDate: "2026-07-10" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejeita sinal maior que o total", async () => {
    const { sut } = makeSut();
    await expect(
      sut.convertToOrder(USER_ID, "quote-1", {
        deliveryDate: "2026-07-10",
        deposit: 100,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("QuotesUseCases.getById/remove", () => {
  it("404 quando não existe", async () => {
    const { sut } = makeSut({ findById: () => Promise.resolve(null) });
    await expect(sut.getById(USER_ID, "x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("remove orçamento", async () => {
    const { sut } = makeSut();
    await expect(sut.remove(USER_ID, "quote-1")).resolves.toBeUndefined();
  });
});
