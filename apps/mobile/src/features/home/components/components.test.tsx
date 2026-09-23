import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Product, Sale } from "@lucro-caseiro/contracts";
import { HomeDayNumbers, HomeFiado, HomeHabitGoal, HomeMonthHero } from ".";

const data = vi.hoisted(() => ({
  today: { data: { totalAmount: 48.5 } as unknown, isError: false, refetch: vi.fn() },
  pending: { data: undefined as unknown, isError: false, refetch: vi.fn() },
}));
vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@lucro-caseiro/ui")>()),
  fonts: {},
  radii: { sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, full: 9999 },
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("react-native", () => ({
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Pressable: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} },
}));
vi.mock("react-native-svg", () => ({ default: () => null, Circle: () => null }));
vi.mock("../../../shared/brand-palette", () => ({ useBrandScreenPalette: () => ({}) }));
vi.mock("../../../shared/components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("../../sales/hooks", () => ({ useTodaySummary: () => data.today }));
vi.mock("../hooks", () => ({
  useHomePendingSales: () => data.pending,
  useHomeProducts: vi.fn(),
}));
afterEach(() => {
  cleanup();
  data.today = { data: { totalAmount: 48.5 }, isError: false, refetch: vi.fn() };
  data.pending = { data: undefined, isError: false, refetch: vi.fn() };
});

let seq = 0;
const NOW = new Date(2026, 8, 23, 15);
const query = <T,>(value: T | undefined, isError = false) => ({
  data: value,
  isError,
  refetch: vi.fn(),
});
const sale = (changes: Partial<Sale>): Sale =>
  ({
    id: `sale-${++seq}`,
    status: "paid",
    paymentMethod: "pix",
    clientId: null,
    clientName: null,
    total: 12,
    paidAmount: 12,
    subtotal: 12,
    discount: 0,
    soldAt: new Date(2026, 8, 23, 10, 32).toISOString(),
    items: [
      {
        id: "i",
        productId: "bolo",
        serviceId: null,
        productName: "bolo de pote",
        quantity: 1,
        unitPrice: 12,
        subtotal: 12,
      },
    ],
    ...changes,
  }) as Sale;
const products = query({
  items: [{ id: "bolo", name: "Bolo de pote", salePrice: 12, costPrice: 6.6 } as Product],
});

describe("home day numbers", () => {
  it("does not display zero while the history and receivables are still loading", () => {
    render(
      <HomeDayNumbers desktop history={query(undefined)} products={products} now={NOW} />,
    );
    expect(screen.getByText(/48,50/)).toBeTruthy();
    expect(screen.queryByText(/0,00/)).toBeNull();
    expect(screen.getByText("Carregando o fiado a receber…")).toBeTruthy();
  });
  it("shows the estimated profit, confirmed zero receivables and the last sale", () => {
    data.pending = query({ items: [] }) as typeof data.pending;
    render(
      <HomeDayNumbers
        desktop
        history={query({ items: [sale({})] })}
        products={products}
        now={NOW}
      />,
    );
    expect(screen.getByText("R$ 5,40")).toBeTruthy();
    expect(screen.getByText("R$ 0,00")).toBeTruthy();
    expect(screen.getByText("10:32")).toBeTruthy();
    expect(screen.getByText("1 bolo de pote")).toBeTruthy();
  });
  it("marks unavailable values instead of fabricating them", () => {
    data.today = query(undefined, true) as typeof data.today;
    render(
      <HomeDayNumbers
        desktop
        history={query(undefined, true)}
        products={products}
        now={NOW}
      />,
    );
    expect(screen.getAllByText("Indisponível").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Não foi possível carregar as vendas de hoje.")).toBeTruthy();
  });
});

describe("home month", () => {
  it("keeps cached month values with a stale warning after a refresh failure", () => {
    render(
      <HomeMonthHero
        desktop
        now={NOW}
        history={query({ items: [sale({ total: 3240 })] }, true)}
        finance={query({
          totalIncome: 2000,
          totalExpenses: 420,
          fixedExpenses: 0,
          variableExpenses: 420,
          profit: 1580,
          period: "2026-09",
        })}
      />,
    );
    expect(screen.getByText("R$ 3.240")).toBeTruthy();
    expect(screen.getByText("R$ 1.580")).toBeTruthy();
    expect(screen.getByText(/última informação disponível/)).toBeTruthy();
  });
  it("waits for the finance summary instead of showing R$ 0,00", () => {
    render(
      <HomeMonthHero
        desktop
        now={NOW}
        history={query({ items: [] })}
        finance={query(undefined)}
      />,
    );
    expect(screen.queryByText(/R\$ 0,00/)).toBeTruthy(); // vendi confirmado
    expect(screen.getByText("…")).toBeTruthy();
    expect(screen.getByText("Carregando entradas e despesas do mês…")).toBeTruthy();
  });
  it("does not suggest creating a goal when the saved goal cannot load", () => {
    render(
      <HomeHabitGoal
        full
        now={NOW}
        history={query({ items: [] })}
        goal={query(undefined, true)}
        onEditGoal={vi.fn()}
      />,
    );
    expect(screen.getByText("Não foi possível carregar sua meta.")).toBeTruthy();
    expect(screen.queryByText("Definir meta")).toBeNull();
  });
  it("sums receivables from every loaded page", () => {
    data.pending = query({
      items: [
        sale({
          status: "pending",
          total: 24,
          paidAmount: 0,
          clientId: "m",
          clientName: "Maria",
        }),
        sale({
          status: "pending",
          total: 45,
          paidAmount: 0,
          clientId: "c",
          clientName: "Dona Cida",
        }),
      ],
    }) as typeof data.pending;
    render(<HomeFiado />);
    expect(screen.getByText("R$ 69,00")).toBeTruthy();
    expect(screen.getByText("R$ 45,00")).toBeTruthy();
    expect(screen.getByText("Cobrar pelo WhatsApp")).toBeTruthy();
  });
});
