import type { Order, Product, Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  HOME_HISTORY_DAYS_FOR_MONTH,
  activeSaleDays,
  agendaCommitted,
  bestWeekday,
  costLookup,
  currentSetupStep,
  doneSetupSteps,
  goalPace,
  greeting,
  hasOlderHistory,
  homePhase,
  lastSevenDays,
  monthChampions,
  monthComparison,
  priceAlert,
  returningClients,
  saleProfit,
  saleSummary,
  salesProfit,
  salesStreak,
  setupSteps,
  weekBars,
} from "./domain";

// Quarta-feira, 23 de setembro de 2026, 15h (horário local).
let seq = 0;
const NOW = new Date(2026, 8, 23, 15);

const at = (month: number, day: number, hour = 10) =>
  new Date(2026, month - 1, day, hour).toISOString();

function makeSale(changes: Partial<Sale> & { soldAt: string }): Sale {
  const items = changes.items ?? [
    {
      id: "i",
      productId: "bolo",
      serviceId: null,
      productName: "Bolo de pote",
      quantity: 1,
      unitPrice: 12,
      subtotal: 12,
    },
  ];
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return {
    id: `sale-${++seq}`,
    userId: "u",
    clientId: null,
    clientName: null,
    status: "paid",
    paymentMethod: "pix",
    subtotal,
    discount: 0,
    discountType: null,
    discountValue: 0,
    total: subtotal,
    paidAmount: subtotal,
    sourceOrderId: null,
    notes: null,
    createdAt: changes.soldAt,
    ...changes,
    items,
  };
}

const product = (changes: Partial<Product>) =>
  ({
    id: "bolo",
    name: "Bolo de pote",
    salePrice: 12,
    costPrice: 6.6,
    isActive: true,
    ...changes,
  }) as Product;

const allSteps = { product: true, price: true, sale: true };

describe("home phase rule", () => {
  it("stays in first steps while any step is missing and history is short", () => {
    expect(
      homePhase({
        steps: { ...allSteps, price: false },
        activeDays: 2,
        olderHistory: false,
      }),
    ).toBe("setup");
    expect(
      homePhase({
        steps: { product: false, price: false, sale: false },
        activeDays: 0,
        olderHistory: true,
      }),
    ).toBe("setup");
  });
  it("shows ready with every step done but fewer than the threshold of days", () => {
    expect(
      homePhase({
        steps: allSteps,
        activeDays: HOME_HISTORY_DAYS_FOR_MONTH - 1,
        olderHistory: false,
      }),
    ).toBe("ready");
  });
  it("shows the month from the threshold on, even with a pending step", () => {
    expect(HOME_HISTORY_DAYS_FOR_MONTH).toBe(7);
    expect(homePhase({ steps: allSteps, activeDays: 7, olderHistory: false })).toBe(
      "month",
    );
    expect(
      homePhase({
        steps: { ...allSteps, price: false },
        activeDays: 1,
        olderHistory: true,
      }),
    ).toBe("month");
  });
  it("counts a saved pricing or a product cost as the price step", () => {
    const base = { hasProduct: true, hasSale: false };
    expect(
      setupSteps({ ...base, hasPricing: false, products: [{ costPrice: null }] }).price,
    ).toBe(false);
    expect(setupSteps({ ...base, hasPricing: true, products: [] }).price).toBe(true);
    expect(
      setupSteps({ ...base, hasPricing: false, products: [{ costPrice: 3 }] }).price,
    ).toBe(true);
  });
  it("points at the first missing step and counts the done ones", () => {
    const steps = { product: true, price: false, sale: false };
    expect(currentSetupStep(steps)).toBe("price");
    expect(doneSetupSteps(steps)).toBe(1);
    expect(currentSetupStep(allSteps)).toBeNull();
  });
  it("detects sales older than the loaded history", () => {
    const insights = {
      monthlyRevenue: [
        { month: "2026-06", revenue: 50, salesCount: 2 },
        { month: "2026-08", revenue: 0, salesCount: 0 },
      ],
    };
    expect(hasOlderHistory(insights, "2026-08-01T03:00:00.000Z")).toBe(true);
    expect(hasOlderHistory(insights, "2026-06-01T03:00:00.000Z")).toBe(false);
    expect(hasOlderHistory(undefined, "2026-08-01T03:00:00.000Z")).toBe(false);
  });
});

describe("home numbers", () => {
  it("greets by the time of day", () => {
    expect(greeting(new Date(2026, 8, 23, 9), "Ana")).toBe("Bom dia, Ana!");
    expect(greeting(NOW, "Ana")).toBe("Boa tarde, Ana!");
    expect(greeting(new Date(2026, 8, 23, 21))).toBe("Boa noite!");
  });
  it("estimates profit from registered cost and flags missing costs", () => {
    const costs = costLookup([product({})]);
    expect(saleProfit(makeSale({ soldAt: at(9, 23) }), costs)).toEqual({
      amount: 5.4,
      complete: true,
    });
    const mixed = makeSale({
      soldAt: at(9, 23),
      discount: 1,
      items: [
        {
          id: "a",
          productId: "bolo",
          serviceId: null,
          productName: "Bolo de pote",
          quantity: 2,
          unitPrice: 12,
          subtotal: 24,
        },
        {
          id: "b",
          productId: "novo",
          serviceId: null,
          productName: "Sem custo",
          quantity: 1,
          unitPrice: 5,
          subtotal: 5,
        },
      ],
    });
    expect(saleProfit(mixed, costs)).toEqual({ amount: 9.8, complete: false });
    const cancelled = makeSale({ soldAt: at(9, 23), status: "cancelled" });
    expect(salesProfit([cancelled], costs)).toEqual({ amount: 0, complete: true });
  });
  it("counts the streak through yesterday until the day is recorded", () => {
    const sales = [20, 21, 22].map((day) => makeSale({ soldAt: at(9, day) }));
    expect(salesStreak(sales, NOW)).toBe(3);
    expect(salesStreak([...sales, makeSale({ soldAt: at(9, 23) })], NOW)).toBe(4);
    expect(salesStreak([makeSale({ soldAt: at(9, 20) })], NOW)).toBe(0);
    expect(lastSevenDays(sales, NOW)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      false,
    ]);
  });
  it("counts distinct days and ignores cancelled sales", () => {
    const sales = [
      makeSale({ soldAt: at(9, 22, 9) }),
      makeSale({ soldAt: at(9, 22, 17) }),
      makeSale({ soldAt: at(9, 21), status: "cancelled" }),
    ];
    expect(activeSaleDays(sales)).toBe(1);
  });
  it("compares the month so far with the same days of the previous month", () => {
    const sales = [
      makeSale({ soldAt: at(9, 5), total: 1120 }),
      makeSale({ soldAt: at(8, 20), total: 1000 }),
      makeSale({ soldAt: at(8, 28), total: 900 }),
    ];
    expect(monthComparison(sales, NOW)).toMatchObject({
      current: 1120,
      previous: 1000,
      pct: 12,
      previousMonth: "agosto",
    });
    expect(monthComparison([sales[0]], NOW).pct).toBeNull();
  });
  it("draws this week from monday and names the best weekday", () => {
    const sales = [
      makeSale({ soldAt: at(9, 19), total: 300 }),
      makeSale({ soldAt: at(9, 22), total: 40 }),
      makeSale({ soldAt: at(9, 23), total: 60 }),
    ];
    const bars = weekBars(sales, NOW);
    expect(bars.map((bar) => bar.label)).toEqual([
      "seg",
      "ter",
      "qua",
      "qui",
      "sex",
      "sáb",
      "dom",
    ]);
    expect(bars[1]).toMatchObject({ total: 40, today: false });
    expect(bars[2]).toMatchObject({ total: 60, today: true });
    expect(bars[3]?.future).toBe(true);
    expect(bestWeekday(sales)).toBe("Sábado");
    expect(bestWeekday([])).toBeNull();
  });
  it("counts clients who bought this month and more than once", () => {
    const sales = [
      makeSale({ soldAt: at(8, 10), clientId: "maria" }),
      makeSale({ soldAt: at(9, 10), clientId: "maria" }),
      makeSale({ soldAt: at(9, 11), clientId: "cida" }),
      makeSale({ soldAt: at(8, 11), clientId: "pedro" }),
      makeSale({ soldAt: at(8, 12), clientId: "pedro" }),
    ];
    expect(returningClients(sales, NOW)).toBe(1);
  });
  it("ranks month champions by estimated profit, skipping unknown costs", () => {
    const costs = costLookup([
      product({}),
      product({ id: "torta", costPrice: 24 }),
      product({ id: "novo", costPrice: null }),
    ]);
    const item = (productId: string, quantity: number, unitPrice: number) => ({
      id: productId,
      productId,
      serviceId: null,
      productName: productId,
      quantity,
      unitPrice,
      subtotal: quantity * unitPrice,
    });
    const sales = [
      makeSale({ soldAt: at(9, 3), items: [item("bolo", 10, 12)] }),
      makeSale({ soldAt: at(9, 4), items: [item("torta", 2, 45), item("novo", 5, 9)] }),
      makeSale({ soldAt: at(8, 30), items: [item("torta", 20, 45)] }),
    ];
    const champions = monthChampions(sales, costs, NOW);
    expect(champions.map((c) => [c.productId, c.profit])).toEqual([
      ["bolo", 54],
      ["torta", 42],
    ]);
  });
  it("projects the goal pace from income per elapsed day", () => {
    expect(goalPace({ currentRevenue: 3240, requiredRevenue: 4000, now: NOW })).toEqual({
      daysLeft: 7,
      onTrack: true,
    });
    expect(
      goalPace({ currentRevenue: 1000, requiredRevenue: 4000, now: NOW }).onTrack,
    ).toBe(false);
  });
  it("alerts only for a product sold this month with margin under 20%", () => {
    const products = [
      product({ id: "brig", name: "Brigadeiro", salePrice: 3.5, costPrice: 2.95 }),
      product({}),
      product({ id: "velho", name: "Parado", salePrice: 10, costPrice: 9.5 }),
    ];
    const item = (productId: string) => ({
      id: productId,
      productId,
      serviceId: null,
      productName: productId,
      quantity: 1,
      unitPrice: 3.5,
      subtotal: 3.5,
    });
    const sales = [
      makeSale({ soldAt: at(9, 5), items: [item("brig")] }),
      makeSale({ soldAt: at(9, 5), items: [item("bolo")] }),
      makeSale({ soldAt: at(8, 5), items: [item("velho")] }),
    ];
    expect(priceAlert(products, sales, NOW)).toMatchObject({
      productId: "brig",
      margin: 0.55,
    });
    expect(priceAlert([product({})], sales, NOW)).toBeNull();
  });
  it("keeps agenda amounts apart from sales and discounts deposits", () => {
    const orders = [
      { id: "a", status: "pending", amount: 220, deposit: 100, saleId: null },
      { id: "b", status: "pending", amount: 50, deposit: 0, saleId: "sale" },
      { id: "c", status: "done", amount: 80, deposit: 0, saleId: null },
    ].map((order) => ({ deliveryDate: "2026-09-24", ...order })) as Order[];
    expect(agendaCommitted(orders)).toBe(120);
  });
  it("summarizes a sale in a few words", () => {
    expect(saleSummary(makeSale({ soldAt: at(9, 23) }))).toBe("1 Bolo de pote");
    expect(saleSummary({ items: [] })).toBe("Venda");
  });
});
