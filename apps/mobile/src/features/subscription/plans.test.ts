import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PlansScreen from "../../app/plans";

const state = vi.hoisted(() => ({
  profileLoading: true,
  limitsLoading: false,
  plan: "free",
  showPaywall: vi.fn(),
  platform: "web",
  checkout: vi.fn(),
  subscribe: vi.fn(),
  restore: vi.fn(),
  stripeLoading: false,
  subscriptionLoading: false,
}));
vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Button: ({
    title,
    onPress,
    loading,
    disabled,
  }: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  }) =>
    React.createElement(
      "button",
      { onClick: onPress, disabled: disabled || loading },
      title,
    ),
  Typography: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("span", null, children),
}));
vi.mock("./use-stripe", () => ({
  useStripeCheckout: () => ({ checkout: state.checkout, loading: state.stripeLoading }),
}));
vi.mock("./use-subscription", () => ({
  useSubscription: () => ({
    subscribe: state.subscribe,
    restore: state.restore,
    loading: state.subscriptionLoading,
  }),
}));
vi.mock("./hooks", () => ({
  useProfile: () => ({
    data: state.profileLoading ? undefined : { plan: state.plan },
    isLoading: state.profileLoading,
  }),
  useLimits: () => ({ data: undefined, isLoading: state.limitsLoading }),
  activePlan: () => state.plan,
}));
vi.mock("../../shared/hooks/use-paywall", () => ({
  usePaywall: () => state.showPaywall,
}));
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
  vi.clearAllMocks();
  state.platform = "web";
  state.stripeLoading = false;
  state.subscriptionLoading = false;
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

vi.mock("../../shared/components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return state.platform;
    },
    select: (options: Record<string, unknown>) => options.android ?? options.default,
  },
  View: ({ children }: { children?: React.ReactNode }) => children,
  ScrollView: ({ children }: { children?: React.ReactNode }) => children,
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    disabled,
  }: {
    children?: React.ReactNode;
    onPress: () => void;
    accessibilityLabel: string;
    disabled?: boolean;
  }) =>
    React.createElement(
      "button",
      { onClick: onPress, "aria-label": accessibilityLabel, disabled },
      children,
    ),
}));

describe("single-page checkout", () => {
  it.each(["web", "ios", "android"])(
    "sends every plan and period directly to payment on %s",
    (platform) => {
      state.profileLoading = false;
      state.platform = platform;
      render(React.createElement(PlansScreen));
      const payment = platform === "android" ? state.subscribe : state.checkout;
      expect(payment).not.toHaveBeenCalled();
      expect(screen.getByText("R$ 29,90 cobrados a cada mês.")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Continuar para pagamento" }));
      expect(payment).toHaveBeenLastCalledWith("essential", "monthly");
      fireEvent.click(screen.getByRole("button", { name: "Anual" }));
      expect(screen.getByText("R$ 299,00 cobrados uma vez por ano.")).toBeTruthy();
      expect(screen.getByText("R$ 299,00")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Continuar para pagamento" }));
      expect(payment).toHaveBeenLastCalledWith("essential", "annual");
      fireEvent.click(screen.getByRole("button", { name: "Ver plano Profissional" }));
      expect(screen.getByText("R$ 699,00 cobrados uma vez por ano.")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Continuar para pagamento" }));
      expect(payment).toHaveBeenLastCalledWith("professional", "annual");
      fireEvent.click(screen.getByRole("button", { name: "Mensal" }));
      fireEvent.click(screen.getByRole("button", { name: "Continuar para pagamento" }));
      expect(payment).toHaveBeenLastCalledWith("professional", "monthly");
      expect(payment).toHaveBeenCalledTimes(4);
      expect(state.showPaywall).not.toHaveBeenCalled();
      expect(
        platform === "android" ? state.checkout : state.subscribe,
      ).not.toHaveBeenCalled();
    },
  );

  it("allows upgrading an Essential subscription without repurchasing the current plan", () => {
    state.profileLoading = false;
    state.plan = "essential";
    render(React.createElement(PlansScreen));
    expect(screen.getByText("Plano ativo")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Continuar para pagamento" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Anual" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ver plano Profissional" }));
    fireEvent.click(screen.getByRole("button", { name: "Anual" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar para pagamento" }));
    expect(state.checkout).toHaveBeenCalledWith("professional", "annual");
  });

  it.each(["web", "android"])(
    "locks choices during payment and permits retry after loading on %s",
    (platform) => {
      state.profileLoading = false;
      state.platform = platform;
      const view = render(React.createElement(PlansScreen));
      state.stripeLoading = platform === "web";
      state.subscriptionLoading = platform === "android";
      view.rerender(React.createElement(PlansScreen));
      fireEvent.click(screen.getByRole("button", { name: "Abrindo pagamento..." }));
      fireEvent.click(screen.getByRole("button", { name: "Ver plano Profissional" }));
      fireEvent.click(screen.getByRole("button", { name: "Anual" }));
      expect(state.checkout).not.toHaveBeenCalled();
      expect(state.subscribe).not.toHaveBeenCalled();
      state.stripeLoading = false;
      state.subscriptionLoading = false;
      view.rerender(React.createElement(PlansScreen));
      fireEvent.click(screen.getByRole("button", { name: "Continuar para pagamento" }));
      expect(
        platform === "android" ? state.subscribe : state.checkout,
      ).toHaveBeenCalledWith("essential", "monthly");
    },
  );
});
