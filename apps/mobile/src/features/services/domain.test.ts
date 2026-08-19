import type { Service } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  buildServiceOverview,
  calculateServicePricing,
  filterServices,
  findServiceItemValidationError,
  serviceMarginPercent,
  servicePriceHealth,
} from "./domain";

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: "123e4567-e89b-12d3-a456-426614174000",
    userId: "123e4567-e89b-12d3-a456-426614174001",
    name: "Consulta",
    description: "Atendimento online",
    durationMinutes: 60,
    defaultPrice: 120,
    materialCost: 0,
    hourlyRate: 50,
    otherCost: 0,
    fixedCostShare: 10,
    markupPercent: 50,
    feesPercent: 0,
    locationMode: "business",
    bufferMinutes: 0,
    publicEnabled: false,
    bookingInstructions: null,
    variations: [],
    addOns: [],
    packages: [],
    active: true,
    createdAt: "2026-07-28T12:00:00.000Z",
    ...overrides,
  };
}

describe("calculateServicePricing", () => {
  it("uses duration and hourly rate to calculate labor", () => {
    const result = calculateServicePricing({
      durationMinutes: 90,
      materialCost: 20,
      hourlyRate: 40,
      otherCost: 5,
      fixedCostShare: 10,
      markupPercent: 50,
      feesPercent: 0,
    });

    expect(result.laborCost).toBe(60);
    expect(result.totalCost).toBe(95);
    expect(result.suggestedPrice).toBe(142.5);
  });

  it("grosses up sale fees without hidden costs", () => {
    const result = calculateServicePricing({
      durationMinutes: 60,
      materialCost: 0,
      hourlyRate: 100,
      otherCost: 0,
      fixedCostShare: 0,
      markupPercent: 0,
      feesPercent: 10,
    });

    expect(result.totalCost).toBe(100);
    expect(result.suggestedPrice).toBeCloseTo(111.11, 2);
    expect(result.feesAmount).toBeCloseTo(11.11, 2);
  });

  it("keeps every result at zero when no cost was informed", () => {
    const result = calculateServicePricing({
      durationMinutes: 60,
      materialCost: 0,
      hourlyRate: 0,
      otherCost: 0,
      fixedCostShare: 0,
      markupPercent: 0,
      feesPercent: 0,
    });

    expect(result).toEqual({
      laborCost: 0,
      totalCost: 0,
      suggestedPrice: 0,
      feesAmount: 0,
    });
  });

  it("flags missing prices and prices below the informed cost", () => {
    expect(servicePriceHealth(makeService({ defaultPrice: null }))).toBe("missing-price");
    expect(servicePriceHealth(makeService({ defaultPrice: 40 }))).toBe("below-cost");
    expect(
      servicePriceHealth(
        makeService({
          defaultPrice: 65,
          feesPercent: 10,
        }),
      ),
    ).toBe("below-cost");
    expect(servicePriceHealth(makeService({ defaultPrice: 120 }))).toBe("costed");
    expect(
      servicePriceHealth(
        makeService({
          hourlyRate: 0,
          fixedCostShare: 0,
          defaultPrice: 120,
        }),
      ),
    ).toBe("price-only");
  });

  it("builds an overview from active services without counting paused services", () => {
    const overview = buildServiceOverview([
      makeService({ id: "service-1", defaultPrice: 100, durationMinutes: 60 }),
      makeService({ id: "service-2", defaultPrice: null, durationMinutes: 90 }),
      makeService({
        id: "service-3",
        active: false,
        defaultPrice: 500,
        durationMinutes: 180,
      }),
    ]);

    expect(overview).toEqual({
      totalCount: 3,
      activeCount: 2,
      pricedCount: 1,
      attentionCount: 1,
      averagePrice: 100,
      averageDurationMinutes: 75,
    });
  });

  it("filters by price review and searches name or description", () => {
    const services = [
      makeService({ id: "service-1", name: "Aula particular", defaultPrice: null }),
      makeService({
        id: "service-2",
        name: "Instalação",
        description: "Atendimento no endereço do cliente",
        defaultPrice: 200,
      }),
      makeService({
        id: "service-3",
        name: "Serviço pausado",
        active: false,
        defaultPrice: null,
      }),
    ];

    expect(filterServices(services, "review", "")).toHaveLength(1);
    expect(
      filterServices(services, "all", "endereço").map((service) => service.id),
    ).toEqual(["service-2"]);
    expect(filterServices(services, "inactive", "")).toHaveLength(1);
  });

  it("searches the service classification without changing the API model", () => {
    const services = [
      makeService({
        id: "service-1",
        description: "Sessão por videochamada",
        locationMode: "online",
      }),
      makeService({
        id: "service-2",
        description: "Atendimento presencial",
        locationMode: "client",
      }),
    ];

    expect(
      filterServices(services, "all", "online").map((service) => service.id),
    ).toEqual(["service-1"]);
    expect(
      filterServices(services, "all", "domicílio").map((service) => service.id),
    ).toEqual(["service-2"]);
  });

  it("calculates the displayed margin from current price and total cost", () => {
    expect(serviceMarginPercent(makeService({ defaultPrice: 120 }))).toBe(50);
    expect(serviceMarginPercent(makeService({ defaultPrice: 0 }))).toBeNull();
    expect(
      serviceMarginPercent(
        makeService({
          defaultPrice: 120,
          hourlyRate: 0,
          fixedCostShare: 0,
        }),
      ),
    ).toBeNull();
  });

  it("identifies the exact incomplete item when a service has multiple options", () => {
    expect(
      findServiceItemValidationError({
        variations: [
          {
            name: "Sessão curta",
            durationMinutes: 30,
            price: 80,
            active: true,
          },
          {
            name: "Sessão completa",
            durationMinutes: 60,
            price: 0,
            active: true,
          },
        ],
        addOns: [],
        packages: [],
      }),
    ).toEqual({
      kind: "variation",
      index: 1,
      field: "price",
      message: "Informe um preço maior que zero para a opção 2.",
    });
  });

  it("accepts multiple complete options, add-ons and packages", () => {
    expect(
      findServiceItemValidationError({
        variations: [
          { name: "Curta", durationMinutes: 30, price: 80, active: true },
          { name: "Completa", durationMinutes: 60, price: 140, active: true },
        ],
        addOns: [{ name: "Deslocamento", durationMinutes: 20, price: 30, active: true }],
        packages: [
          {
            name: "Mensal",
            sessions: 4,
            price: 500,
            validityDays: 45,
            recurrenceDays: 7,
            active: true,
          },
        ],
      }),
    ).toBeNull();
  });
});
