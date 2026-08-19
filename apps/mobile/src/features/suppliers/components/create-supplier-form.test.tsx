import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lucro-caseiro/ui", () => ({
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {title}
    </button>
  ),
  spacing: { lg: 16, xl: 20 },
}));
vi.mock("../../../shared/components/standard-modal", () => ({
  StandardModal: ({
    visible,
    onClose,
    title,
    closeAccessibilityLabel,
    children,
    footer,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    closeAccessibilityLabel?: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) =>
    visible ? (
      <div>
        <h1>{title}</h1>
        <button
          type="button"
          aria-label={closeAccessibilityLabel ?? "Fechar"}
          onClick={onClose}
        >
          ×
        </button>
        {children}
        {footer}
      </div>
    ) : null,
}));
vi.mock("../../../shared/components/keyboard-aware-scroll-view", () => ({
  KeyboardAwareScrollView: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("../../../shared/layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));
vi.mock("../../../shared/layout/desktop-density", () => ({
  desktopStretch: () => ({}),
  desktopWidths: { form: 560 },
  pageGutter: () => ({}),
}));
vi.mock("../../../shared/hooks/use-limit-check", () => ({
  useLimitCheck: () => ({ checkAndBlock: () => false }),
}));
vi.mock("../../../shared/hooks/use-paywall", () => ({ usePaywall: () => vi.fn() }));
vi.mock("../../../shared/components/alert-store", () => ({ showAlert: vi.fn() }));
vi.mock("../../../shared/utils/alerts", () => ({ alertError: vi.fn() }));
vi.mock("../hooks", () => ({
  useCreateSupplier: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useSuppliers: () => ({ data: { items: [] } }),
}));
vi.mock("./supplier-form", () => ({
  SupplierForm: React.forwardRef((_props, _ref) => <div>Campos do fornecedor</div>),
}));

import { CreateSupplierForm } from "./create-supplier-form";

describe("CreateSupplierForm modal", () => {
  afterEach(cleanup);

  it("opens and closes through the standard modal flow", () => {
    const onClose = vi.fn();
    const view = render(<CreateSupplierForm modal={{ visible: false, onClose }} />);
    expect(screen.queryByText("Novo fornecedor")).toBeNull();

    view.rerender(<CreateSupplierForm modal={{ visible: true, onClose }} />);
    expect(screen.getByText("Novo fornecedor")).toBeTruthy();
    expect(screen.getByText("Cadastrar fornecedor")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
