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
      received: 0,
      toReceive: 0,
    });
  });

  it("received = soma dos sinais; a receber = soma de (valor - sinal)", () => {
    const summary = buildOrdersSummary([
      { status: "pending", count: 2, amount: 100, deposit: 20 },
      { status: "in_production", count: 1, amount: 50, deposit: 0 },
      { status: "ready", count: 1, amount: 30, deposit: 10 },
      { status: "done", count: 3, amount: 300, deposit: 90 },
    ]);

    expect(summary.totalOrders).toBe(7);
    expect(summary.totalAmount).toBe(480);
    expect(summary.received).toBe(120);
    expect(summary.toReceive).toBe(360);
  });

  it("nao desconta o sinal de encomenda entregue do a receber (sinal parcial)", () => {
    // Espelha o caso da usuaria: 1 encomenda entregue de 1200 com sinal 60.
    const summary = buildOrdersSummary([
      { status: "done", count: 1, amount: 1200, deposit: 60 },
    ]);

    expect(summary.received).toBe(60);
    expect(summary.toReceive).toBe(1140);
  });

  it("ignores cancelled orders in totals and payment sums", () => {
    const summary = buildOrdersSummary([
      { status: "pending", count: 1, amount: 100, deposit: 30 },
      { status: "cancelled", count: 5, amount: 999, deposit: 500 },
    ]);

    expect(summary.totalOrders).toBe(1);
    expect(summary.totalAmount).toBe(100);
    expect(summary.received).toBe(30);
    expect(summary.toReceive).toBe(70);
  });
});

describe("todayISO", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayISO(new Date(2026, 4, 9))).toBe("2026-05-09");
  });
});
