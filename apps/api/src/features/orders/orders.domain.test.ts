import { describe, expect, it } from "vitest";

import { buildOrdersSummary, isTerminal, todayISO, validateOrder } from "./orders.domain";

describe("validateOrder", () => {
  it("rejeita sinal maior que o valor da encomenda", () => {
    const errors = validateOrder({
      title: "Kit festa",
      deliveryDate: "2026-07-01",
      amount: 100,
      deposit: 150,
    });
    expect(errors).toContain("O sinal nao pode ser maior que o valor da encomenda");
  });

  it("aceita sinal menor ou igual ao valor", () => {
    const errors = validateOrder({
      title: "Kit festa",
      deliveryDate: "2026-07-01",
      amount: 100,
      deposit: 50,
    });
    expect(errors).toHaveLength(0);
  });

  it("rejeita sinal negativo", () => {
    const errors = validateOrder({
      title: "Kit festa",
      deliveryDate: "2026-07-01",
      deposit: -1,
    });
    expect(errors).toContain("O sinal nao pode ser negativo");
  });

  it("accepts valid data", () => {
    expect(
      validateOrder({ title: "Bolo de chocolate", deliveryDate: "2026-05-30" }),
    ).toEqual([]);
  });

  it("requires title and date on create", () => {
    const errors = validateOrder({ title: "", deliveryDate: "" });
    expect(errors).toContain("O titulo e obrigatorio");
    expect(errors).toContain("Data de entrega invalida");
  });

  it("rejects invalid date", () => {
    expect(validateOrder({ title: "X", deliveryDate: "30/05/2026" })).toContain(
      "Data de entrega invalida",
    );
  });

  it("rejects invalid time and negative amount", () => {
    const errors = validateOrder({
      title: "X",
      deliveryDate: "2026-05-30",
      deliveryTime: "9h",
      amount: -5,
    });
    expect(errors).toContain("Horario invalido");
    expect(errors).toContain("O valor nao pode ser negativo");
  });

  it("in partial mode only checks provided fields", () => {
    expect(validateOrder({ amount: 10 }, true)).toEqual([]);
    expect(validateOrder({ title: "" }, true)).toContain("O titulo e obrigatorio");
  });
});

describe("isTerminal", () => {
  it("marks done and cancelled as terminal", () => {
    expect(isTerminal("done")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("pending")).toBe(false);
    expect(isTerminal("ready")).toBe(false);
  });
});

describe("buildOrdersSummary", () => {
  it("returns zeros for no rows", () => {
    expect(buildOrdersSummary([])).toEqual({
      totalOrders: 0,
      totalAmount: 0,
      pending: { count: 0, amount: 0 },
      delivered: { count: 0, amount: 0 },
    });
  });

  it("buckets active statuses into pending and done into delivered", () => {
    const summary = buildOrdersSummary([
      { status: "pending", count: 2, amount: 100 },
      { status: "in_production", count: 1, amount: 50 },
      { status: "ready", count: 1, amount: 30 },
      { status: "done", count: 3, amount: 300 },
    ]);

    expect(summary.totalOrders).toBe(7);
    expect(summary.totalAmount).toBe(480);
    expect(summary.pending).toEqual({ count: 4, amount: 180 });
    expect(summary.delivered).toEqual({ count: 3, amount: 300 });
  });

  it("ignores cancelled orders in totals and buckets", () => {
    const summary = buildOrdersSummary([
      { status: "pending", count: 1, amount: 100 },
      { status: "cancelled", count: 5, amount: 999 },
    ]);

    expect(summary.totalOrders).toBe(1);
    expect(summary.totalAmount).toBe(100);
    expect(summary.pending).toEqual({ count: 1, amount: 100 });
    expect(summary.delivered).toEqual({ count: 0, amount: 0 });
  });
});

describe("todayISO", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayISO(new Date(2026, 4, 9))).toBe("2026-05-09");
  });
});
