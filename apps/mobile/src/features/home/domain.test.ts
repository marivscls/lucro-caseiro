import { describe, expect, it } from "vitest";
import type { Order, Product, Sale } from "@lucro-caseiro/contracts";
import {
  homeAttention,
  dayAppointments,
  nextAppointments,
  pendingReceipts,
  queryState,
  quickActions,
} from "./domain";

const order = (id: string, changes: Partial<Order> = {}) =>
  ({
    id,
    title: id,
    deliveryDate: "2026-09-10",
    deliveryTime: "10:00",
    status: "pending",
    appointmentStatus: null,
    ...changes,
  }) as Order;

describe("home data", () => {
  it("keeps the next appointment visible even with several overdue orders", () => {
    const rows = [1, 2, 3, 4].map((i) =>
      order(`late-${i}`, { deliveryDate: `2026-09-0${i}` }),
    );
    rows.push(order("next", { deliveryDate: "2026-09-11" }));
    expect(dayAppointments(rows, "2026-09-10").map((item) => item.id)).toEqual([
      "late-1",
      "late-2",
      "next",
    ]);
  });
  it("keeps unknown, failed, stale and confirmed zero distinct", () => {
    expect(queryState({ data: undefined, isError: false })).toBe("loading");
    expect(queryState({ data: undefined, isError: true })).toBe("error");
    expect(queryState({ data: 0, isError: false })).toBe("ready");
    expect(queryState({ data: 20, isError: true })).toBe("stale");
  });
  it("orders pending deadlines and excludes finished or cancelled appointments", () => {
    const rows = [
      order("later", { deliveryDate: "2026-09-12" }),
      order("today"),
      order("late", { deliveryDate: "2026-09-09" }),
      order("done", { status: "done" }),
      order("cancel", { status: "cancelled" }),
      order("service", { appointmentStatus: "completed" }),
    ];
    expect(nextAppointments(rows).map((item) => item.id)).toEqual([
      "late",
      "today",
      "later",
    ]);
    expect(rows[0].id).toBe("later");
  });
  it("calculates only outstanding sale amounts without charging paid or cancelled sales", () => {
    const rows = [
      { id: "a", status: "pending", total: 200, paidAmount: 50 },
      { id: "b", status: "paid", total: 100, paidAmount: 100 },
      { id: "c", status: "cancelled", total: 500, paidAmount: 0 },
      { id: "d", status: "pending", total: 20, paidAmount: 25 },
    ] as Sale[];
    expect(pendingReceipts(rows)).toEqual({ total: 150, count: 1 });
  });
  it("offers service actions and respects scheduling availability", () => {
    expect(quickActions(true, true).map((a) => a.label)).toContain("Agendar atendimento");
    expect(quickActions(true, true).map((a) => a.label)).not.toContain("Produtos");
    expect(
      quickActions(true, false).some((a) => a.route.startsWith("/tabs/agenda")),
    ).toBe(false);
    expect(quickActions(false, true)).toHaveLength(4);
  });
  it("only warns about explicitly controlled stock or known negative margins", () => {
    const rows = [
      {
        id: "low",
        name: "Peça",
        saleUnit: "unit",
        isComposite: false,
        stockQuantity: 1,
        stockAlertThreshold: 2,
        costPrice: null,
        salePrice: 10,
      },
      {
        id: "unknown",
        name: "Sem controle",
        saleUnit: "unit",
        isComposite: false,
        stockQuantity: null,
        stockAlertThreshold: null,
        costPrice: null,
        salePrice: 20,
      },
      {
        id: "loss",
        name: "Kit",
        saleUnit: "unit",
        isComposite: true,
        stockQuantity: 0,
        stockAlertThreshold: 2,
        costPrice: 30,
        salePrice: 25,
      },
    ] as Product[];
    const alerts = homeAttention(rows);
    expect(alerts.map((a) => a.id)).toEqual(["stock-low", "price-loss"]);
    expect(homeAttention([])).toEqual([]);
  });
});
