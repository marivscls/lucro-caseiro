import type { Order } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { formatDateBR, groupOrders, upcomingCount } from "./domain";

let idCounter = 0;

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: `order-${++idCounter}`,
    userId: "u",
    clientId: null,
    clientName: null,
    title: "Bolo",
    deliveryDate: "2026-05-15",
    deliveryTime: null,
    status: "pending",
    amount: null,
    deposit: null,
    theme: null,
    honoree: null,
    colors: null,
    photoUrl: null,
    notes: null,
    saleId: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

const TODAY = new Date(2026, 4, 15); // 2026-05-15

describe("groupOrders", () => {
  it("buckets by date and omits empty groups", () => {
    const orders = [
      makeOrder({ deliveryDate: "2026-05-10" }), // overdue
      makeOrder({ deliveryDate: "2026-05-15" }), // today
      makeOrder({ deliveryDate: "2026-05-16" }), // tomorrow
      makeOrder({ deliveryDate: "2026-05-20" }), // week
      makeOrder({ deliveryDate: "2026-06-10" }), // later
      makeOrder({ deliveryDate: "2026-05-12", status: "done" }), // finished
    ];
    const groups = groupOrders(orders, TODAY);
    expect(groups.map((g) => g.key)).toEqual([
      "overdue",
      "today",
      "tomorrow",
      "week",
      "later",
      "finished",
    ]);
  });

  it("excludes done/cancelled from date buckets (go to finished)", () => {
    const orders = [
      makeOrder({ deliveryDate: "2026-05-15", status: "done" }),
      makeOrder({ deliveryDate: "2026-05-15", status: "cancelled" }),
    ];
    const groups = groupOrders(orders, TODAY);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("finished");
  });
});

describe("upcomingCount", () => {
  it("counts active orders due today, tomorrow or overdue", () => {
    const orders = [
      makeOrder({ deliveryDate: "2026-05-10" }), // overdue
      makeOrder({ deliveryDate: "2026-05-15" }), // today
      makeOrder({ deliveryDate: "2026-05-16" }), // tomorrow
      makeOrder({ deliveryDate: "2026-05-25" }), // far -> not counted
      makeOrder({ deliveryDate: "2026-05-15", status: "done" }), // done -> not counted
    ];
    expect(upcomingCount(orders, TODAY)).toBe(3);
  });
});

describe("formatDateBR", () => {
  it("formats YYYY-MM-DD to DD/MM/YYYY", () => {
    expect(formatDateBR("2026-05-09")).toBe("09/05/2026");
  });
});
