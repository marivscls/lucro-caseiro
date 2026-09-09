import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PlansScreen from "../../app/plans";

const state = vi.hoisted(() => ({
  profileLoading: true,
  limitsLoading: false,
  plan: "free",
}));
vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Typography: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("span", null, children),
}));
vi.mock("./hooks", () => ({
  useProfile: () => ({
    data: state.profileLoading ? undefined : { plan: state.plan },
    isLoading: state.profileLoading,
  }),
  useLimits: () => ({ data: undefined, isLoading: state.limitsLoading }),
  activePlan: () => state.plan,
}));
vi.mock("../../shared/hooks/use-paywall", () => ({ usePaywall: () => vi.fn() }));
vi.mock("../../shared/components/screen-header", () => ({ ScreenHeader: () => null }));
vi.mock("../../shared/layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));
vi.mock("../../shared/components/skeleton", () => ({
  Skeleton: () => React.createElement("span", null, "Carregando"),
  SkeletonCard: () => React.createElement("span", null, "Carregando"),
}));
vi.mock("../../shared/utils/subscription-management", () => ({
  openSubscriptionManagement: vi.fn(),
}));

afterEach(cleanup);
beforeEach(() => {
  state.profileLoading = true;
  state.limitsLoading = false;
  state.plan = "free";
});

describe("plans loading", () => {
  it("shows placeholders instead of a free plan while the profile loads", () => {
    render(React.createElement(PlansScreen));
    expect(screen.getAllByText("Carregando").length).toBeGreaterThan(0);
    expect(screen.queryByText("Escolha seu plano")).toBeNull();
  });

  it("waits for free account usage and then renders the comparison", () => {
    state.profileLoading = false;
    state.limitsLoading = true;
    const view = render(React.createElement(PlansScreen));
    expect(screen.getAllByText("Carregando").length).toBeGreaterThan(0);
    state.limitsLoading = false;
    view.rerender(React.createElement(PlansScreen));
    expect(screen.queryByText("Carregando")).toBeNull();
    expect(screen.getByText("Escolha seu plano")).toBeTruthy();
  });

  it("does not block a paid plan on the unused free usage query", () => {
    state.profileLoading = false;
    state.limitsLoading = true;
    state.plan = "professional";
    render(React.createElement(PlansScreen));
    expect(screen.queryByText("Carregando")).toBeNull();
    expect(screen.getByText("Sua assinatura")).toBeTruthy();
  });
});
