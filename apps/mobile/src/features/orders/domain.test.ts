import type { Order } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  agendaDateLimit,
  agendaDayCountLabel,
  agendaStripDays,
  agendaTimelineSlots,
  agendaSummaryLabels,
  formatDateBR,
  groupOrders,
  upcomingCount,
} from "./domain";

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
    serviceId: null,
    serviceName: null,
    serviceVariationId: null,
    serviceVariationName: null,
    serviceAddOnIds: [],
    serviceAddOnNames: [],
    servicePackagePurchaseId: null,
    durationMinutes: null,
    appointmentStatus: null,
    locationMode: null,
    locationDetails: null,
    actualCost: null,
    completedAt: null,
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

describe("agenda presentation", () => {
  it("keeps the mobile date row short enough to show every date", () => {
    expect(agendaDateLimit(false)).toBe(5);
    expect(agendaDateLimit(true)).toBe(7);
  });

  it("describes the period represented by the summary", () => {
    expect(agendaSummaryLabels(null)).toEqual({
      title: "Resumo geral",
      total: "Todos os pedidos",
    });
    expect(agendaSummaryLabels("2026-05-09")).toEqual({
      title: "Resumo do dia",
      total: "Total do dia",
    });
  });
});

describe("agendaStripDays", () => {
  it("lists the next days from today with their order counts", () => {
    // Arrange
    const today = new Date(2026, 8, 23); // quarta-feira, 23/09/2026
    const options = [
      { date: "2026-09-24", count: 1 },
      { date: "2026-09-26", count: 2 },
      { date: "2026-10-30", count: 5 },
    ];

    // Act
    const days = agendaStripDays(options, today, 7);

    // Assert
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ date: "2026-09-23", day: 23, label: "Hoje", count: 0 });
    expect(days[1]).toMatchObject({ date: "2026-09-24", label: "qui", count: 1 });
    expect(days[3]).toMatchObject({ date: "2026-09-26", count: 2 });
    expect(days[6].date).toBe("2026-09-29");
  });

  it("crosses the month boundary", () => {
    const days = agendaStripDays([], new Date(2026, 8, 29), 3);
    expect(days.map((day) => day.date)).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
    ]);
  });
});

describe("agendaDayCountLabel", () => {
  const noun = { singular: "encomenda", plural: "encomendas" };

  it("calls an empty day free", () => {
    expect(agendaDayCountLabel(0, noun)).toBe("Livre");
  });

  it("uses singular and plural nouns", () => {
    expect(agendaDayCountLabel(1, noun)).toBe("1 encomenda");
    expect(agendaDayCountLabel(3, noun)).toBe("3 encomendas");
  });
});

describe("agendaTimelineSlots", () => {
  it("covers 8h to 18h in 30 minute slots", () => {
    const slots = agendaTimelineSlots([]);
    expect(slots).toHaveLength(20);
    expect(slots[0]).toEqual({ label: "08:00", busyWith: null });
    expect(slots[19].label).toBe("17:30");
  });

  it("marks the slots taken by active orders with a time", () => {
    // Arrange
    const orders = [
      makeOrder({ title: "Bolo", deliveryTime: "09:00", durationMinutes: null }),
      makeOrder({ title: "Entregue", deliveryTime: "11:00", status: "done" }),
      makeOrder({ title: "Sem hora", deliveryTime: null }),
    ];

    // Act
    const busy = agendaTimelineSlots(orders).filter((slot) => slot.busyWith);

    // Assert
    expect(busy.map((slot) => slot.label)).toEqual(["09:00", "09:30"]);
    expect(busy[0].busyWith).toBe("Bolo");
  });
});
