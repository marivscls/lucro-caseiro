import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getActiveBrand } from "@lucro-caseiro/brands";

import { Paywall } from "./paywall";
import { SubscriptionCheckout } from "./subscription-checkout";
import { getPaywallCopy } from "../limit-copy";
import { TIER_BENEFITS } from "../plan-benefits";

const state = vi.hoisted(() => ({
  resource: "suppliers",
  checkout: vi.fn(),
  subscribe: vi.fn(),
}));

vi.mock("@lucro-caseiro/ui", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../test/mocks/ui")>();
  return {
    ...original,
    Typography: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("span", null, children),
    useTheme: () => ({
      ...original.useTheme(),
      theme: { ...original.useTheme().theme, shadows: { sm: {}, md: {} } },
    }),
    useBrand: () => getActiveBrand(),
    fontSizes: { sm: 14, md: 16, lg: 18, xl: 20 },
    PressableScale: ({
      children,
      onPress,
      accessibilityLabel,
    }: {
      children?: React.ReactNode;
      onPress?: () => void;
      accessibilityLabel?: string;
    }) =>
      React.createElement(
        "button",
        { onClick: onPress, "aria-label": accessibilityLabel },
        children,
      ),
  };
});
vi.mock("react-native", () => ({
  View: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
  ScrollView: ({ children }: { children?: React.ReactNode }) => children,
  Image: () => null,
  Platform: { OS: "android" },
  StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 1 },
  useWindowDimensions: () => ({ width: 375, height: 812 }),
}));
vi.mock("../hooks", () => ({ useProfile: () => ({ data: undefined }) }));
vi.mock("../../../shared/hooks/use-paywall", () => ({
  usePaywall: (select: (value: typeof state) => unknown) => select(state),
}));
vi.mock("../use-subscription", () => ({
  useSubscription: () => ({
    subscribe: state.subscribe,
    restore: vi.fn(),
    loading: false,
  }),
}));
vi.mock("../use-stripe", () => ({
  useStripeCheckout: () => ({ checkout: state.checkout, loading: false }),
}));

afterEach(cleanup);

describe("paywall contextual", () => {
  it("renders the title and message supplied by its caller", () => {
    render(
      React.createElement(Paywall, {
        title: "Seu catálogo",
        message: "Personalize sua vitrine.",
      }),
    );
    expect(screen.getByText("Seu catálogo")).toBeTruthy();
    expect(screen.getByText("Personalize sua vitrine.")).toBeTruthy();
  });

  it("keeps the triggering resource visible through the checkout", () => {
    render(React.createElement(SubscriptionCheckout, {}));
    const copy = getPaywallCopy("suppliers");
    expect(screen.getByText(copy.title)).toBeTruthy();
    expect(screen.getByText(copy.message)).toBeTruthy();
    fireEvent.click(screen.getByText("Desbloquear Premium"));
    expect(state.subscribe).toHaveBeenCalledWith("professional", "annual");
  });

  it("lists every Premium benefit", () => {
    render(React.createElement(Paywall, {}));
    for (const benefit of TIER_BENEFITS.professional) {
      expect(screen.getByText(benefit)).toBeTruthy();
    }
  });

  it("leads with the monthly value and states the yearly charge", () => {
    render(React.createElement(Paywall, {}));
    expect(screen.getByText("R$ 37,42")).toBeTruthy();
    expect(screen.getByText("R$ 449,00 cobrados uma vez por ano.")).toBeTruthy();
    expect(screen.getByText("Sem fidelidade: cancele quando quiser.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Selecionar cobrança mensal"));
    expect(screen.getByText("R$ 49,90")).toBeTruthy();
    expect(screen.getByText("Cobrado todo mês.")).toBeTruthy();
  });

  it("opens the plans comparison when offered", () => {
    const onSeePlans = vi.fn();
    render(React.createElement(Paywall, { onSeePlans }));
    fireEvent.click(screen.getByText("Comparar planos"));
    expect(onSeePlans).toHaveBeenCalledTimes(1);
  });
});
