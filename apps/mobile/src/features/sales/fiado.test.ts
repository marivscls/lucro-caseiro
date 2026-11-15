import type { Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  buildChargeMessage,
  createsFiado,
  fiadoInitials,
  fiadoTiming,
  fiadoTimingLabel,
  groupFiados,
  launchCountLabel,
  oldFiadoSummary,
  openFiados,
  totalOwed,
} from "./fiado";

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    userId: "u1",
    clientId: "c1",
    clientName: "Maria Silva",
    status: "pending",
    paymentMethod: "credit",
    subtotal: 20,
    discount: 0,
    discountType: null,
    discountValue: 0,
    total: 20,
    paidAmount: 0,
    sourceOrderId: null,
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

describe("oldFiadoSummary", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  it("counts only pending sales older than the minimum age", () => {
    const sales = [
      makeSale({ id: "old", soldAt: "2026-06-01T12:00:00.000Z", total: 40 }),
      makeSale({ id: "recent", soldAt: "2026-06-08T12:00:00.000Z", total: 10 }),
      makeSale({ id: "paid", soldAt: "2026-05-01T12:00:00.000Z", status: "paid" }),
    ];
    expect(oldFiadoSummary(sales, now, 7)).toEqual({ count: 1, total: 40 });
  });

  it("returns zero when nothing is old enough", () => {
    const sales = [makeSale({ soldAt: "2026-06-09T12:00:00.000Z" })];
    expect(oldFiadoSummary(sales, now, 7)).toEqual({ count: 0, total: 0 });
  });
});

describe("fiadoTiming", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  it("classifies the existing seven-day threshold as overdue", () => {
    expect(fiadoTiming("2026-06-03T12:00:00.000Z", now)).toEqual({
      kind: "overdue",
      days: 0,
    });
    expect(fiadoTiming("2026-06-01T12:00:00.000Z", now)).toEqual({
      kind: "overdue",
      days: 2,
    });
  });

  it("separates the next three days from regular open charges", () => {
    expect(fiadoTiming("2026-06-06T12:00:00.000Z", now)).toEqual({
      kind: "upcoming",
      days: 3,
    });
    expect(fiadoTiming("2026-06-09T12:00:00.000Z", now)).toEqual({
      kind: "open",
      days: 6,
    });
  });
});

describe("fiadoTimingLabel", () => {
  it("describes open, upcoming and overdue charges", () => {
    expect(fiadoTimingLabel({ kind: "open", days: 5 })).toBe("Em aberto");
    expect(fiadoTimingLabel({ kind: "upcoming", days: 1 })).toBe("Vence amanhã");
    expect(fiadoTimingLabel({ kind: "upcoming", days: 2 })).toBe("Vence em 2 dias");
    expect(fiadoTimingLabel({ kind: "overdue", days: 0 })).toBe("Venceu hoje");
    expect(fiadoTimingLabel({ kind: "overdue", days: 1 })).toBe("Vencido há 1 dia");
    expect(fiadoTimingLabel({ kind: "overdue", days: 4 })).toBe("Vencido há 4 dias");
  });
});

describe("fiadoInitials and launchCountLabel", () => {
  it("uses up to two initials and pluralizes launches", () => {
    expect(fiadoInitials("juliana pereira souza")).toBe("JP");
    expect(fiadoInitials("Rafael")).toBe("R");
    expect(fiadoInitials("   ")).toBe("?");
    expect(launchCountLabel(1)).toBe("1 lançamento");
    expect(launchCountLabel(3)).toBe("3 lançamentos");
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

describe("buildChargeMessage com Pix e extrato", () => {
  it("inclui o link do extrato e o Pix sozinho numa linha", () => {
    const [group] = groupFiados([makeSale({ total: 45 })]);
    const msg = buildChargeMessage(group, {
      pixCode: "00020126PIX",
      statementUrl: "https://api.exemplo/f/abc",
    });
    expect(msg).toContain("Seu extrato completo: https://api.exemplo/f/abc");
    expect(msg.split("\n")).toContain("00020126PIX");
    expect(msg).toContain("me avisa por aqui");
  });

  it("sem Pix mantém o fechamento de antes", () => {
    const [group] = groupFiados([makeSale({ total: 45 })]);
    expect(buildChargeMessage(group)).toContain("é só me chamar");
  });
});

describe("createsFiado", () => {
  it("é fiado quando algum pagamento é na forma fiado", () => {
    expect(createsFiado(["credit"])).toBe(true);
    expect(createsFiado(["pix", "credit"])).toBe(true);
  });

  it("não é fiado quando tudo é pago na hora", () => {
    expect(createsFiado(["pix"])).toBe(false);
    expect(createsFiado(["cash", "card"])).toBe(false);
  });

  it("é fiado quando o valor recebido fica abaixo do total", () => {
    expect(createsFiado(["pix"], 30, 50)).toBe(true);
    expect(createsFiado(["pix"], 50, 50)).toBe(false);
    // Arredonda centavos: 0,1 + 0,2 recebidos cobrem 0,30.
    expect(createsFiado(["pix"], 0.1 + 0.2, 0.3)).toBe(false);
  });
});
