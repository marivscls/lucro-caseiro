import type { Client, Sale } from "@lucro-caseiro/contracts";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeLapsedClients } from "./lapsed-clients";

const mocks = vi.hoisted(() => ({ openWhatsApp: vi.fn() }));
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
vi.mock("../../../shared/brand-palette", () => ({ useBrandScreenPalette: () => ({}) }));
vi.mock("../../../shared/components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("../../../shared/utils/whatsapp", () => ({ openWhatsApp: mocks.openWhatsApp }));
afterEach(() => {
  cleanup();
  mocks.openWhatsApp.mockReset();
});

const NOW = new Date(2026, 10, 15, 10);
const query = <T,>(data: T | undefined, isError = false) => ({
  data,
  isError,
  refetch: vi.fn(),
});
const daysAgo = (days: number) => new Date(2026, 10, 15 - days, 10).toISOString();
const sale = (clientId: string, days: number, total = 50) =>
  ({
    id: `${clientId}-${days}`,
    clientId,
    status: "paid",
    soldAt: daysAgo(days),
    total,
  }) as Sale;
const clients = query({
  items: [
    { id: "ana", name: "Ana Souza", phone: "(11) 98888-7777" },
    { id: "bia", name: "Bia", phone: "(11) 97777-6666" },
  ] as Client[],
});

describe("HomeLapsedClients", () => {
  it("lists the lapsed client and opens WhatsApp with a ready message", () => {
    // Arrange
    const sales = query({ items: [sale("ana", 80), sale("ana", 45), sale("bia", 3)] });

    // Act
    render(
      <HomeLapsedClients
        sales={sales}
        clients={clients}
        now={NOW}
        businessName="Doces da Maria"
        service={false}
      />,
    );
    fireEvent.click(screen.getByLabelText("Chamar Ana Souza no WhatsApp"));

    // Assert
    expect(screen.getByText("Clientes que sumiram")).toBeTruthy();
    expect(screen.getByText("Última compra há 45 dias")).toBeTruthy();
    expect(screen.queryByText("Bia")).toBeNull();
    expect(mocks.openWhatsApp).toHaveBeenCalledWith(
      "(11) 98888-7777",
      expect.stringContaining("Oi, Ana! Tudo bem? Aqui é da Doces da Maria."),
    );
  });

  it("takes no space while loading, on error or when nobody is gone", () => {
    // Act
    const loading = render(
      <HomeLapsedClients
        sales={query(undefined)}
        clients={clients}
        now={NOW}
        service={false}
      />,
    );
    const loadingHtml = loading.container.innerHTML;
    cleanup();
    const failed = render(
      <HomeLapsedClients
        sales={query(undefined, true)}
        clients={clients}
        now={NOW}
        service={false}
      />,
    );
    const failedHtml = failed.container.innerHTML;
    cleanup();
    const none = render(
      <HomeLapsedClients
        sales={query({ items: [sale("bia", 40), sale("bia", 2)] })}
        clients={clients}
        now={NOW}
        service={false}
      />,
    );

    // Assert
    expect(loadingHtml).toBe("");
    expect(failedHtml).toBe("");
    expect(none.container.innerHTML).toBe("");
  });
});
