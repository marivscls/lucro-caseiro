import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRouter = vi.hoisted(() => ({
  navigate: vi.fn(),
  replace: vi.fn(),
}));

const navState = vi.hoisted(() => ({
  isDesktop: false,
  isAuthenticated: true,
  hasScheduling: true,
  pathname: "/tabs",
  segments: ["tabs"] as string[],
}));

vi.mock("expo-router", () => ({
  usePathname: () => navState.pathname,
  useRouter: () => mockRouter,
  useSegments: () => navState.segments,
}));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

vi.mock("react-native", () => ({
  Dimensions: { get: () => ({ width: 390, height: 844, fontScale: 1 }) },
  Platform: { OS: "web", select: (spec: { web?: number; default?: number }) => spec.web },
  useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }),
  Pressable: ({
    accessibilityLabel,
    accessibilityState,
    children,
    onPress,
  }: {
    accessibilityLabel?: string;
    accessibilityState?: { selected?: boolean };
    children?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <button
      aria-label={accessibilityLabel}
      aria-selected={accessibilityState?.selected}
      onClick={onPress}
      type="button"
    >
      {children}
    </button>
  ),
  View: ({
    accessibilityLabel,
    children,
  }: {
    accessibilityLabel?: string;
    children?: React.ReactNode;
  }) => <div aria-label={accessibilityLabel}>{children}</div>,
  StyleSheet: { create: (sheet: Record<string, unknown>) => sheet },
  Animated: {
    View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Value: class {
      constructor(public value: number) {}
    },
    spring: () => ({ start: () => undefined }),
  },
}));

vi.mock("lucide-react-native", () => ({
  CalendarDays: () => null,
  Ellipsis: () => null,
  House: () => null,
  Plus: () => null,
  ShoppingBag: () => null,
  Users: () => null,
}));

vi.mock("@lucro-caseiro/ui", () => ({
  controlSizes: { compact: 40, large: 48 },
  iconSizes: { list: 22 },
  radii: { md: 12, xl: 20, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 12, "2xl": 24 },
  Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  useFeature: () => navState.hasScheduling,
  useReducedMotion: () => true,
}));

vi.mock("../brand-palette", () => ({
  useBrandScreenPalette: () => ({
    white: "#fff",
    border: "#eadadd",
    wineFill: "#4A2332",
    wine: "#4A2332",
    muted: "#6D6266",
    onWine: "#fff",
    surface: "#f5f3f1",
  }),
}));

vi.mock("../hooks/use-auth", () => ({
  useAuth: () => ({ isAuthenticated: navState.isAuthenticated }),
}));

vi.mock("../layout/use-desktop-layout", () => ({
  useDesktopLayout: () => navState.isDesktop,
}));

import { MobileFloatingTabBar } from "./mobile-floating-tab-bar";

describe("MobileFloatingTabBar", () => {
  beforeEach(() => {
    mockRouter.navigate.mockReset();
    mockRouter.replace.mockReset();
    navState.isDesktop = false;
    navState.isAuthenticated = true;
    navState.hasScheduling = true;
    navState.pathname = "/tabs";
    navState.segments = ["tabs"];
  });

  afterEach(cleanup);

  it("mostra Vender e guarda Nova venda no leitor de tela", () => {
    render(<MobileFloatingTabBar />);

    expect(screen.getByText("Vender")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nova venda" })).toBeTruthy();
    expect(screen.queryByText("Nova venda")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Início" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("abre a venda pelo atalho central", () => {
    render(<MobileFloatingTabBar />);

    fireEvent.click(screen.getByRole("button", { name: "Nova venda" }));

    expect(mockRouter.navigate).toHaveBeenCalledWith("/tabs/new-sale");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("abre Vendas com navigate a partir de uma tela empilhada", () => {
    navState.pathname = "/products";
    navState.segments = ["products"];
    render(<MobileFloatingTabBar />);

    fireEvent.click(screen.getByRole("button", { name: "Vendas" }));

    expect(mockRouter.navigate).toHaveBeenCalledWith("/tabs/sales");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("some no layout desktop", () => {
    navState.isDesktop = true;
    render(<MobileFloatingTabBar />);

    expect(screen.queryByText("Vender")).toBeNull();
  });
});
