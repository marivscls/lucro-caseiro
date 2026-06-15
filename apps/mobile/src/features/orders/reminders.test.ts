import type { Order } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { reminderInstant, shouldScheduleReminder } from "./reminders";

// 1 de junho de 2026, meio-dia (horário local) — base estável para os testes.
const NOW = new Date(2026, 5, 1, 12, 0, 0);

describe("reminderInstant", () => {
  it("agenda na véspera da entrega às 9h", () => {
    const when = reminderInstant("2026-06-20", NOW);
    expect(when).not.toBeNull();
    expect(when?.getFullYear()).toBe(2026);
    expect(when?.getMonth()).toBe(5); // junho (0-based)
    expect(when?.getDate()).toBe(19); // véspera
    expect(when?.getHours()).toBe(9);
  });

  it("retorna null quando o instante já passou", () => {
    const past = new Date(2026, 5, 25, 12, 0, 0);
    expect(reminderInstant("2026-06-20", past)).toBeNull();
  });

  it("retorna null para data inválida", () => {
    expect(reminderInstant("", NOW)).toBeNull();
    expect(reminderInstant("abc", NOW)).toBeNull();
  });
});

describe("shouldScheduleReminder", () => {
  function order(overrides: Partial<Pick<Order, "status" | "deliveryDate">>) {
    return {
      status: "pending" as Order["status"],
      deliveryDate: "2026-06-20",
      ...overrides,
    };
  }

  it("agenda para encomenda em aberto com data futura", () => {
    expect(shouldScheduleReminder(order({}), NOW)).toBe(true);
  });

  it("não agenda para encomenda entregue ou cancelada", () => {
    expect(shouldScheduleReminder(order({ status: "done" }), NOW)).toBe(false);
    expect(shouldScheduleReminder(order({ status: "cancelled" }), NOW)).toBe(false);
  });

  it("não agenda quando a data já passou", () => {
    const past = new Date(2026, 5, 25, 12, 0, 0);
    expect(shouldScheduleReminder(order({}), past)).toBe(false);
  });
});
