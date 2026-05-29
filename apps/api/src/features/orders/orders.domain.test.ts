import { describe, expect, it } from "vitest";

import { isTerminal, todayISO, validateOrder } from "./orders.domain";

describe("validateOrder", () => {
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

describe("todayISO", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayISO(new Date(2026, 4, 9))).toBe("2026-05-09");
  });
});
