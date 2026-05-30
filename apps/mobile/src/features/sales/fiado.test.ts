import type { Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { buildChargeMessage, groupFiados, openFiados, totalOwed } from "./fiado";

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    userId: "u1",
    clientId: "c1",
    clientName: "Maria Silva",
    status: "pending",
    paymentMethod: "credit",
    total: 20,
    notes: null,
    items: [],
    soldAt: "2026-05-20T12:00:00.000Z",
    createdAt: "2026-05-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("openFiados", () => {
  it("keeps only pending sales", () => {
    const sales = [makeSale(), makeSale({ id: "s2", status: "paid" })];
    expect(openFiados(sales)).toHaveLength(1);
  });
});

describe("groupFiados", () => {
  it("groups by client, sums totals, sorts by most owed", () => {
    const sales = [
      makeSale({ id: "a", clientId: "c1", clientName: "Maria", total: 10 }),
      makeSale({ id: "b", clientId: "c2", clientName: "João", total: 50 }),
      makeSale({ id: "c", clientId: "c1", clientName: "Maria", total: 15 }),
      makeSale({ id: "d", clientId: null, clientName: null, total: 5 }),
      makeSale({ id: "e", status: "paid", total: 999 }),
    ];
    const groups = groupFiados(sales);
    expect(groups.map((g) => g.clientName)).toEqual(["João", "Maria", "Cliente avulso"]);
    expect(groups[1].total).toBe(25);
    expect(totalOwed(openFiados(sales))).toBe(80);
  });
});

describe("buildChargeMessage", () => {
  it("greets by first name and lists the total", () => {
    const [group] = groupFiados([
      makeSale({ clientId: "c1", clientName: "Maria Silva", total: 30 }),
    ]);
    const msg = buildChargeMessage(group);
    expect(msg).toContain("Oi, Maria!");
    expect(msg).toContain("*Total: R$ 30,00*");
  });
});
