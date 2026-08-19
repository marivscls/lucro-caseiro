import type { Client, Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  buildClientListInsights,
  countClientListFilters,
  filterAndSortClientInsights,
} from "./client-list";

const now = new Date("2026-08-16T12:00:00.000Z");

function client(id: string, name: string, totalSpent = 0, tags: string[] = []): Client {
  return {
    id,
    userId: "00000000-0000-0000-0000-000000000001",
    name,
    phone: null,
    address: null,
    birthday: null,
    notes: null,
    tags,
    nextContactAt: null,
    nextContactReason: null,
    nextContactNotes: null,
    totalSpent,
    createdAt: "2026-01-01T12:00:00.000Z",
  };
}

function sale(
  id: string,
  clientId: string,
  soldAt: string,
  status: Sale["status"],
): Sale {
  return {
    id,
    userId: "00000000-0000-0000-0000-000000000001",
    clientId,
    clientName: null,
    status,
    paymentMethod: "cash",
    subtotal: 50,
    discount: 0,
    discountType: null,
    discountValue: 0,
    total: 50,
    paidAmount: status === "pending" ? 2 : 50,
    sourceOrderId: null,
    notes: null,
    items: [],
    soldAt,
    createdAt: soldAt,
  };
}

describe("client list insights", () => {
  it("calcula compras no mês, fiado e frequência sem contar vendas canceladas", () => {
    const clients = [
      client("c1", "Aline", 100, ["Cliente frequente"]),
      client("c2", "Bruna"),
    ];
    const sales = [
      sale("s1", "c1", "2026-08-14T12:00:00.000Z", "paid"),
      sale("s2", "c1", "2026-08-10T12:00:00.000Z", "pending"),
      sale("s3", "c1", "2026-08-09T12:00:00.000Z", "cancelled"),
    ];

    const [aline] = buildClientListInsights(clients, sales, now);

    expect(aline).toMatchObject({
      monthOrders: 2,
      pendingTotal: 48,
      saleCount: 2,
      frequent: true,
    });
  });

  it("filtra fiado e ordena por maior valor comprado", () => {
    const insights = buildClientListInsights(
      [client("c1", "Aline", 86), client("c2", "Bruna", 142)],
      [sale("s1", "c1", "2026-08-14T12:00:00.000Z", "pending")],
      now,
    );

    expect(filterAndSortClientInsights(insights, "credit", "recent", now)).toHaveLength(
      1,
    );
    expect(
      filterAndSortClientInsights(insights, "all", "highest", now)[0]?.client.name,
    ).toBe("Bruna");
  });

  it("conta cada filtro a partir dos insights ja carregados", () => {
    const insights = buildClientListInsights(
      [client("c1", "Aline", 86, ["Cliente frequente"]), client("c2", "Bruna", 142)],
      [sale("s1", "c1", "2026-08-14T12:00:00.000Z", "pending")],
      now,
    );

    expect(countClientListFilters(insights, now)).toEqual({
      all: 2,
      recent: 1,
      frequent: 1,
      credit: 1,
    });
  });
});
