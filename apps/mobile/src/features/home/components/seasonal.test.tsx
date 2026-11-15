import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeSeasonalCard } from "./seasonal";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  storage: new Map<string, string>(),
}));
vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@lucro-caseiro/ui")>()),
  fonts: {},
  radii: { sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, full: 9999 },
}));
vi.mock("react-native", () => ({
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
  }) => (
    <button aria-label={accessibilityLabel} onClick={onPress}>
      {children}
    </button>
  ),
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("../../../shared/brand-palette", () => ({ useBrandScreenPalette: () => ({}) }));
vi.mock("../../../shared/components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("../../../shared/utils/async-storage", () => ({
  asyncStorage: {
    getItem: (key: string) => Promise.resolve(mocks.storage.get(key) ?? null),
    setItem: (key: string, value: string) => {
      mocks.storage.set(key, value);
      return Promise.resolve();
    },
    removeItem: () => Promise.resolve(),
  },
}));
afterEach(() => {
  cleanup();
  mocks.push.mockReset();
  mocks.storage.clear();
});

const NOW = new Date(2026, 10, 15, 10);

describe("HomeSeasonalCard", () => {
  it("shows the nearest date with the tip and both shortcuts", async () => {
    // Act
    render(<HomeSeasonalCard now={NOW} userId="u1" scheduling service={false} />);

    // Assert
    expect(await screen.findByText("Faltam 12 dias para a Black Friday")).toBeTruthy();
    fireEvent.click(screen.getByText("Anotar encomenda"));
    fireEvent.click(screen.getByText("Divulgar catálogo"));
    expect(mocks.push).toHaveBeenNthCalledWith(1, "/tabs/agenda?create=home");
    expect(mocks.push).toHaveBeenNthCalledWith(2, "/catalog");
  });

  it("hides the agenda shortcut when the brand has no scheduling", async () => {
    // Act
    render(<HomeSeasonalCard now={NOW} userId="u1" scheduling={false} service={false} />);

    // Assert
    expect(await screen.findByText("Divulgar catálogo")).toBeTruthy();
    expect(screen.queryByText("Anotar encomenda")).toBeNull();
  });

  it("dismisses only that date, saves it and moves on to the next one", async () => {
    // Arrange
    render(<HomeSeasonalCard now={NOW} userId="u1" scheduling service={false} />);
    await screen.findByText("Faltam 12 dias para a Black Friday");

    // Act
    fireEvent.click(screen.getByLabelText("Esconder o aviso: Black Friday"));

    // Assert
    expect(await screen.findByText("Faltam 40 dias para o Natal")).toBeTruthy();
    await waitFor(() =>
      expect(mocks.storage.get("home-seasonal-dismissed:v1:u1")).toBe(
        JSON.stringify(["black-friday-2026"]),
      ),
    );
  });

  it("respects a date dismissed earlier", async () => {
    // Arrange
    mocks.storage.set(
      "home-seasonal-dismissed:v1:u1",
      JSON.stringify(["black-friday-2026"]),
    );

    // Act
    render(<HomeSeasonalCard now={NOW} userId="u1" scheduling service={false} />);

    // Assert
    expect(await screen.findByText("Faltam 40 dias para o Natal")).toBeTruthy();
    expect(screen.queryByText(/Black Friday/)).toBeNull();
  });
});
