import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Purchase } from "@lucro-caseiro/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ enabled: false, create: vi.fn(), update: vi.fn() }));
vi.mock("@lucro-caseiro/ui", async (original) => ({
  ...(await original<object>()),
  useFeature: () => state.enabled,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    title,
    onPress,
    disabled,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <button disabled={disabled} onClick={onPress}>
      {title}
    </button>
  ),
  Input: ({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
  }) => (
    <input
      aria-label={label}
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
    />
  ),
  Chip: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button onClick={onPress}>{label}</button>
  ),
}));
vi.mock("../../../shared/components/standard-modal", () => ({
  StandardModal: ({
    children,
    footer,
  }: {
    children: React.ReactNode;
    footer: React.ReactNode;
  }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));
vi.mock("../../../shared/components/form-step-progress", () => ({
  FormStepProgress: () => null,
}));
vi.mock("../../../shared/components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("../../../shared/layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));
vi.mock("../../suppliers/components/supplier-selector", () => ({
  SupplierSelector: () => null,
}));
vi.mock("../../subscription/business-copy", () => ({
  useBusinessCopy: () => ({ materialNoun: "insumo", packagingNoun: "embalagem" }),
}));
vi.mock("../../products/hooks", () => ({ useProducts: () => ({ data: { items: [] } }) }));
vi.mock("../hooks", () => ({
  useCreatePurchase: () => ({ mutateAsync: state.create, isPending: false }),
  useUpdatePurchase: () => ({ mutateAsync: state.update, isPending: false }),
}));

import { CreatePurchaseForm } from "./create-purchase-form";

const purchase: Purchase = {
  id: "p",
  userId: "u",
  supplierId: null,
  description: "Reposição",
  amount: 30,
  category: "material",
  paymentStatus: "pending",
  purchasedAt: "2026-09-10",
  dueDate: null,
  paidAt: null,
  financeEntryId: null,
  createdAt: "2026-09-10T00:00:00Z",
  items: [
    {
      id: "i",
      productId: "product",
      productName: "Caderno",
      variationId: null,
      variationName: null,
      quantity: 3,
      unitCost: 10,
      subtotal: 30,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  state.enabled = false;
});

describe("compras sem suporte a entrada de estoque", () => {
  it("revisa a recompra como despesa sem enviar itens indisponíveis", async () => {
    render(<CreatePurchaseForm visible onClose={() => {}} prefill={purchase} />);
    expect(screen.queryByText("PRODUTOS RECEBIDOS")).toBeNull();
    expect(screen.getByLabelText("Valor (R$)")).toHaveProperty("value", "30,00");
    expect(screen.getByText(/registrada somente como despesa/i)).toBeTruthy();
    fireEvent.click(screen.getByText("Continuar"));
    fireEvent.click(screen.getByText("Continuar"));
    fireEvent.click(screen.getByText("Registrar compra"));
    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 30, items: undefined }),
      ),
    );
  });

  it("bloqueia edição incompatível sem apagar estoque de compra existente", () => {
    render(<CreatePurchaseForm visible onClose={() => {}} purchase={purchase} />);
    expect(screen.getByText(/edição desta compra com estoque/i)).toBeTruthy();
    expect(screen.queryByText("Salvar alterações")).toBeNull();
    expect(screen.queryByText("Continuar")).toBeNull();
    expect(state.update).not.toHaveBeenCalled();
  });

  it("mantém estoque e itens quando a marca permite", () => {
    state.enabled = true;
    render(<CreatePurchaseForm visible onClose={() => {}} prefill={purchase} />);
    expect(screen.getByText("PRODUTOS RECEBIDOS")).toBeTruthy();
    expect(screen.getByText("Caderno")).toBeTruthy();
    expect(screen.queryByLabelText("Valor (R$)")).toBeNull();
  });
});
