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
    render(
      React.createElement(SubscriptionCheckout, { recommendedTier: "professional" }),
    );
    const copy = getPaywallCopy("suppliers");
    expect(screen.getByText(copy.title)).toBeTruthy();
    expect(screen.getByText(copy.message)).toBeTruthy();
    fireEvent.click(screen.getByText("Desbloquear Profissional"));
    expect(state.subscribe).toHaveBeenCalledWith("professional", "annual");
  });

  it("includes the supplier cap and monthly PDF in essential benefits", () => {
    render(React.createElement(Paywall, { recommendedTier: "essential" }));
    for (const benefit of TIER_BENEFITS.essential) {
      expect(screen.getByText(benefit)).toBeTruthy();
    }
  });
});
