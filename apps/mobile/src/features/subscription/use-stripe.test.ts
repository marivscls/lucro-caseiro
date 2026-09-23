import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStripeCheckout } from "./use-stripe";

const mocks = vi.hoisted(() => ({
  createStripeCheckout: vi.fn(),
  fetchProfile: vi.fn(),
  track: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setQueryData: vi.fn(),
  }),
}));
vi.mock("expo-web-browser", () => ({
  openBrowserAsync: vi.fn().mockResolvedValue({ type: "dismiss" }),
}));
vi.mock("../../shared/hooks/use-auth", () => ({
  useAuth: () => ({ token: "sessao" }),
}));
vi.mock("../analytics/tracker", () => ({ trackAnalyticsAction: mocks.track }));
vi.mock("./api", () => ({
  createStripeCheckout: mocks.createStripeCheckout,
  fetchProfile: mocks.fetchProfile,
}));

function purchaseResults() {
  return mocks.track.mock.calls.filter(([name]) => name === "purchase_result");
}

describe("useStripeCheckout — resultado da compra", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.createStripeCheckout.mockResolvedValue({
      url: "https://checkout.stripe.com/x",
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("registra sucesso quando o plano pago aparece depois do checkout", async () => {
    // Arrange
    mocks.fetchProfile.mockResolvedValue({ id: "u", plan: "essential" });
    const { result } = renderHook(() => useStripeCheckout());

    // Act
    await act(async () => {
      await result.current.checkout("essential", "monthly");
      await vi.advanceTimersByTimeAsync(2_500);
    });

    // Assert
    expect(purchaseResults()).toEqual([
      [
        "purchase_result",
        "sessao",
        { result: "success", provider: "stripe", plan: "essential", period: "monthly" },
      ],
    ]);
  });

  it("registra desistência quando o plano não muda após fechar o checkout", async () => {
    // Arrange
    mocks.fetchProfile.mockResolvedValue({ id: "u", plan: "free" });
    const { result } = renderHook(() => useStripeCheckout());

    // Act
    await act(async () => {
      await result.current.checkout("professional", "annual");
      await vi.advanceTimersByTimeAsync(6 * 2_500);
    });

    // Assert
    expect(purchaseResults()[0]?.[2]).toMatchObject({
      result: "cancel",
      plan: "professional",
    });
  });

  it("registra falha quando o checkout não abre", async () => {
    // Arrange
    mocks.createStripeCheckout.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useStripeCheckout());

    // Act
    await act(async () => {
      await result.current.checkout("essential", "monthly");
    });

    // Assert
    expect(purchaseResults()[0]?.[2]).toMatchObject({
      result: "failure",
      provider: "stripe",
    });
  });
});
