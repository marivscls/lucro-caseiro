import type { Client, Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  LAPSED_LOOKBACK_DAYS,
  lapsedClientMessage,
  lapsedClients,
  lapsedLookbackStart,
  lastPurchaseLabel,
} from "./lapsed-clients";

type ClientRow = Pick<Client, "id" | "name" | "phone">;
type SaleRow = Pick<Sale, "clientId" | "status" | "soldAt" | "total">;

const NOW = new Date(2026, 10, 15, 15);
const daysAgo = (days: number, hour = 10) =>
  new Date(2026, 10, 15 - days, hour).toISOString();
const client = (
  id: string,
  name: string,
  phone: string | null = "(11) 99999-0000",
): ClientRow => ({
  id,
  name,
  phone,
});
const sale = (
  clientId: string | null,
  days: number,
  total = 50,
  status: Sale["status"] = "paid",
): SaleRow => ({
  clientId,
  status,
  soldAt: daysAgo(days),
  total,
});

function makeSut(clients: ClientRow[], sales: SaleRow[]) {
  return lapsedClients(clients, sales, NOW);
}

describe("lapsedClients", () => {
  it("lists a regular client whose last purchase was 30+ days ago", () => {
    // Arrange
    const clients = [client("ana", "Ana Souza")];
    const sales = [sale("ana", 90, 40), sale("ana", 45, 60)];

    // Act
    const result = makeSut(clients, sales);

    // Assert
    expect(result).toEqual([
      {
        clientId: "ana",
        name: "Ana Souza",
        phone: "(11) 99999-0000",
        lastSaleAt: daysAgo(45),
        daysAway: 45,
        purchases: 2,
        spent: 100,
      },
    ]);
  });

  it("starts exactly at 30 days and ignores 29", () => {
    // Arrange
    const clients = [client("a", "Ana"), client("b", "Bia")];
    const sales = [sale("a", 60), sale("a", 30), sale("b", 60), sale("b", 29)];

    // Act
    const result = makeSut(clients, sales);

    // Assert
    expect(result.map((item) => item.clientId)).toEqual(["a"]);
  });

  it("needs at least two purchases that were not cancelled", () => {
    // Arrange
    const clients = [client("a", "Ana"), client("b", "Bia")];
    const sales = [
      sale("a", 70),
      sale("b", 70),
      sale("b", 40, 50, "cancelled"),
      sale(null, 40),
    ];

    // Act
    const result = makeSut(clients, sales);

    // Assert
    expect(result).toEqual([]);
  });

  it("counts a pending (fiado) sale as a purchase", () => {
    // Arrange
    const clients = [client("a", "Ana")];
    const sales = [sale("a", 70), sale("a", 40, 30, "pending")];

    // Act
    const result = makeSut(clients, sales);

    // Assert
    expect(result[0]?.purchases).toBe(2);
  });

  it("skips clients without a valid phone", () => {
    // Arrange
    const clients = [
      client("a", "Ana", null),
      client("b", "Bia", "1234"),
      client("c", "Cris", "  "),
    ];
    const sales = ["a", "b", "c"].flatMap((id) => [sale(id, 80), sale(id, 50)]);

    // Act
    const result = makeSut(clients, sales);

    // Assert
    expect(result).toEqual([]);
  });

  it("orders by most spent, then longest gone, and keeps at most 3", () => {
    // Arrange
    const clients = [
      client("a", "Ana"),
      client("b", "Bia"),
      client("c", "Cris"),
      client("d", "Duda"),
    ];
    const sales = [
      sale("a", 100, 50),
      sale("a", 40, 50), // 100, 40 dias
      sale("b", 120, 150),
      sale("b", 35, 150), // 300
      sale("c", 150, 50),
      sale("c", 90, 50), // 100, 90 dias
      sale("d", 60, 10),
      sale("d", 31, 10), // 20
    ];

    // Act
    const result = makeSut(clients, sales);

    // Assert
    expect(result.map((item) => item.clientId)).toEqual(["b", "c", "a"]);
  });

  it("ignores clients that bought recently even if they bought a lot before", () => {
    // Arrange
    const clients = [client("a", "Ana")];
    const sales = [sale("a", 150, 500), sale("a", 120, 500), sale("a", 3, 10)];

    // Act
    const result = makeSut(clients, sales);

    // Assert
    expect(result).toEqual([]);
  });
});

describe("lapsed helpers", () => {
  it("starts the lookback at local midnight 180 days ago", () => {
    // Act
    const start = new Date(lapsedLookbackStart(NOW));

    // Assert
    expect(LAPSED_LOOKBACK_DAYS).toBe(180);
    expect([
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      start.getHours(),
    ]).toEqual([2026, 4, 19, 0]);
  });

  it("labels the last purchase", () => {
    // Act / Assert
    expect(lastPurchaseLabel(45)).toBe("Última compra há 45 dias");
    expect(lastPurchaseLabel(1)).toBe("Última compra há 1 dia");
  });

  it("writes a short message with the first name and the business name", () => {
    // Act
    const message = lapsedClientMessage({
      clientName: "Ana Souza",
      businessName: "Doces da Maria",
    });

    // Assert
    expect(message).toBe(
      "Oi, Ana! Tudo bem? Aqui é da Doces da Maria. Faz tempo que você não aparece e lembrei de você. Quer fazer um pedido esta semana? 😊",
    );
  });

  it("skips the business sentence when there is no name and asks for a time slot for services", () => {
    // Act
    const message = lapsedClientMessage({
      clientName: "Bia",
      businessName: "  ",
      service: true,
    });

    // Assert
    expect(message).toBe(
      "Oi, Bia! Tudo bem? Faz tempo que você não aparece e lembrei de você. Quer agendar um horário esta semana? 😊",
    );
  });
});
