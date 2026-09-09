import React from "react";
import type { SupplierOverviewItem } from "@lucro-caseiro/contracts";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => {
  const Container = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children);
  return {
    View: Container,
    ScrollView: Container,
    Image: () => null,
    RefreshControl: () => null,
    TextInput: () => null,
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    Platform: { OS: "web" },
    StyleSheet: { create: (styles: unknown) => styles },
    Pressable: ({
      children,
      onPress,
      accessibilityLabel,
      accessibilityRole,
      accessibilityState,
    }: {
      children?: React.ReactNode;
      onPress?: () => void;
      accessibilityLabel?: string;
      accessibilityRole?: string;
      accessibilityState?: { selected?: boolean };
    }) =>
      React.createElement(
        "div",
        {
          role: accessibilityRole,
          onClick: onPress,
          "aria-label": accessibilityLabel,
          "aria-selected": accessibilityState?.selected,
        },
        children,
      ),
    FlatList: ({
      data,
      renderItem,
      ListHeaderComponent,
    }: {
      data: SupplierOverviewItem[];
      renderItem: (props: { item: SupplierOverviewItem }) => React.ReactNode;
      ListHeaderComponent: React.ReactNode;
    }) =>
      React.createElement(
        "div",
        null,
        ListHeaderComponent,
        ...data.map((item) =>
          React.createElement(React.Fragment, { key: item.id }, renderItem({ item })),
        ),
      ),
  };
});
vi.mock("@lucro-caseiro/ui", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    fonts: { regular: "System", bold: "System", semiBold: "System" },
    fontSizes: { md: 16 },
    Chip: () => null,
    FilterChipRow: ({ children }: { children: React.ReactNode }) => children,
    useTheme: () => ({
      theme: {
        mode: "light",
        colors: { text: "#111", border: "#ccc" },
        shadows: { sm: {} },
      },
    }),
  };
});
vi.mock("../../../shared/layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));
vi.mock("../../../shared/components/screen-create-bar", () => ({
  ScreenCreateBar: () => null,
}));
vi.mock("../../../shared/components/standard-modal", () => ({
  StandardModal: ({
    visible,
    title,
    children,
    onClose,
  }: {
    visible: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    visible
      ? React.createElement(
          "div",
          { role: "dialog", "aria-label": title },
          children,
          React.createElement("button", { onClick: onClose }, "Fechar"),
        )
      : null,
}));
vi.mock("./supplier-avatar", () => ({ SupplierAvatar: () => null }));
vi.mock("../hooks", () => ({
  useSuppliersOverview: () => ({
    data: {
      items: suppliers,
      month: { totalAmount: 0, purchaseCount: 0, supplierCount: 0 },
    },
    isLoading: false,
    error: null,
    isRefetching: false,
  }),
}));

import { SupplierList } from "./supplier-list";

function supplier(id: string, name: string, createdAt: string): SupplierOverviewItem {
  return {
    id,
    name,
    createdAt,
    updatedAt: createdAt,
    userId: "user-1",
    category: "supplies",
    phone: null,
    hasWhatsApp: false,
    email: null,
    address: null,
    notes: null,
    purchaseDescription: null,
    isPreferred: false,
    avatarType: "initials",
    avatarPresetId: null,
    avatarUrl: null,
    needsFollowUp: false,
    restockSoon: false,
    isActive: true,
    lastPurchase: {
      id: `purchase-${id}`,
      description: "Reposição",
      amount: 10,
      category: "material",
      purchasedAt: createdAt.slice(0, 10),
      items: [],
    },
    totalPurchaseCount: 1,
    totalPurchaseAmount: 10,
    hasOpenOrder: false,
  };
}
const suppliers = [
  supplier("z", "Zélia", "2026-09-08T00:00:00Z"),
  supplier("a", "Ana", "2026-09-01T00:00:00Z"),
];
function setup() {
  const callbacks = {
    onSupplierPress: vi.fn(),
    onEditPress: vi.fn(),
    onArchivePress: vi.fn(),
    onDeletePress: vi.fn(),
    onReorderPress: vi.fn(),
    onWhatsAppPress: vi.fn(),
    onToggleFollowUp: vi.fn(),
    onToggleRestock: vi.fn(),
    onAddPress: vi.fn(),
  };
  render(React.createElement(SupplierList, callbacks));
  return callbacks;
}

describe("Supplier menus", () => {
  afterEach(cleanup);

  it("sorts the visible suppliers through a selected option and closes the dialog", () => {
    setup();
    expect(
      screen
        .getAllByRole("button", { name: /^Ver fornecedor / })
        .map((el) => el.getAttribute("aria-label")),
    ).toEqual(["Ver fornecedor Zélia", "Ver fornecedor Ana"]);
    fireEvent.click(screen.getByRole("button", { name: "Ordenação: Mais recentes" }));
    const dialog = screen.getByRole("dialog", { name: "Ordenar fornecedores" });
    expect(
      within(dialog)
        .getByRole("button", { name: "Mais recentes" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    fireEvent.click(within(dialog).getByRole("button", { name: "A–Z" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen
        .getAllByRole("button", { name: /^Ver fornecedor / })
        .map((el) => el.getAttribute("aria-label")),
    ).toEqual(["Ver fornecedor Ana", "Ver fornecedor Zélia"]);
  });

  it("edits the chosen supplier from the action dialog without opening its details", () => {
    const callbacks = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ações de Ana" }));
    const dialog = screen.getByRole("dialog", { name: "Ana" });
    expect(
      within(dialog).queryByRole("button", { name: "Falar no WhatsApp" }),
    ).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Editar fornecedor" }));
    expect(callbacks.onEditPress).toHaveBeenCalledWith(suppliers[1]);
    expect(callbacks.onSupplierPress).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes actions without changing the supplier", () => {
    const callbacks = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ações de Ana" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Ana" })).getByRole("button", {
        name: "Fechar",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(callbacks.onDeletePress).not.toHaveBeenCalled();
    expect(callbacks.onArchivePress).not.toHaveBeenCalled();
  });
});
