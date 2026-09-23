import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  back: vi.fn(),
  canGoBack: vi.fn(() => false),
  navigate: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useFocusEffect: () => undefined,
  useLocalSearchParams: () => ({}),
  useRouter: () => navigation,
}));
vi.mock("../../shared/components/screen-header", () => ({
  ScreenHeader: ({ onBack }: { onBack: () => void }) => (
    <button onClick={onBack}>Voltar</button>
  ),
}));
vi.mock("./components/unified-pricing-calculator", () => ({
  UnifiedPricingCalculator: () => null,
}));
vi.mock("./components/pricing-history-modal", () => ({
  PricingHistoryButton: () => null,
  PricingHistoryModal: () => null,
}));

import PricingScreen from "../../app/pricing";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  navigation.canGoBack.mockReturnValue(false);
});

describe("retorno da precificação", () => {
  it("abre a aba Mais sem disparar REPLACE em um navigator interno", () => {
    render(<PricingScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(navigation.navigate).toHaveBeenCalledWith("/tabs/more");
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
