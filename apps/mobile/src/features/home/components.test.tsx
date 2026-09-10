import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { HomeMoney, HomeGoal } from "./components";

const data = vi.hoisted(() => ({
  finance: { data: undefined as unknown, isError: false, refetch: vi.fn() },
}));
vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@lucro-caseiro/ui")>()),
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("../../shared/brand-palette", () => ({ useBrandScreenPalette: () => ({}) }));
vi.mock("../../shared/components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("../../shared/components/feature-motion", () => ({ GoalProgress: () => null }));
vi.mock("../finance/hooks", () => ({
  useFinanceRangeSummary: () => data.finance,
  useFinanceSummary: () => data.finance,
}));
vi.mock("../sales/hooks", () => ({
  useTodaySummary: () => ({
    data: { totalAmount: 48.5 },
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("../insights/hooks", () => ({
  useInsights: () => ({ data: { totalRevenue: 48.5 }, isError: false, refetch: vi.fn() }),
}));
vi.mock("./hooks", () => ({
  useHomePendingSales: () => ({ data: undefined, isError: false, refetch: vi.fn() }),
  useHomeProducts: vi.fn(),
}));
afterEach(() => {
  cleanup();
  data.finance = { data: undefined, isError: false, refetch: vi.fn() };
});

describe("home independent query states", () => {
  const money = () =>
    render(
      <HomeMoney
        today="2026-09-10"
        orders={{ data: [], isError: false, refetch: vi.fn() }}
        scheduling={false}
      />,
    );
  it("does not display zero while finance is still loading after sales arrive", () => {
    money();
    expect(screen.getByText(/48,50/)).toBeTruthy();
    expect(screen.getByText("Carregando entradas e despesas…")).toBeTruthy();
    expect(screen.queryByText(/0,00/)).toBeNull();
  });
  it("shows error instead of a fabricated finance balance", () => {
    data.finance.isError = true;
    money();
    expect(
      screen.getByText("Não foi possível carregar entradas e despesas."),
    ).toBeTruthy();
    expect(screen.queryByText(/Saldo dos lançamentos/)).toBeNull();
  });
  it("shows confirmed zero and explains the balance", () => {
    data.finance.data = { totalIncome: 0, totalExpenses: 0 };
    money();
    expect(screen.getByText(/Saldo dos lançamentos:.*0,00/)).toBeTruthy();
  });
  it("keeps cached values with a stale warning after refresh failure", () => {
    data.finance = {
      data: { totalIncome: 100, totalExpenses: 20 },
      isError: true,
      refetch: vi.fn(),
    };
    money();
    expect(screen.getByText(/última informação disponível/)).toBeTruthy();
    expect(screen.getByText(/Saldo dos lançamentos:.*80,00/)).toBeTruthy();
  });
  it("does not suggest creating a goal when the saved goal cannot load", () => {
    render(
      <HomeGoal
        query={{ data: undefined, isError: true, refetch: vi.fn() }}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Não foi possível carregar sua meta.")).toBeTruthy();
    expect(screen.queryByText("Definir meta")).toBeNull();
  });
});
