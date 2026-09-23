import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lucro-caseiro/ui", async (original) => ({
  ...(await original<object>()),
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
    <button onClick={onPress}>{title}</button>
  ),
  Chip: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button onClick={onPress}>{label}</button>
  ),
  Input: ({
    label,
    placeholder,
    value,
    onChangeText,
  }: {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (value: string) => void;
  }) => (
    <input
      aria-label={label ?? placeholder}
      value={value}
      onChange={(event) => onChangeText(event.target.value)}
    />
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
vi.mock("../../../shared/layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));
vi.mock("../../clients/components/client-picker-modal", () => ({
  ClientPickerModal: () => null,
}));
vi.mock("../../labels/components/label-product-picker", () => ({
  ProductPicker: () => null,
}));
vi.mock("../hooks", () => ({
  useCreateQuote: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateQuote: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { QuoteForm } from "./quote-form";

afterEach(cleanup);

describe("avanço do orçamento", () => {
  it("não avança com quantidade vazia", () => {
    render(<QuoteForm visible onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Kit festa" },
    });
    fireEvent.click(screen.getByText("Continuar"));
    fireEvent.change(screen.getByLabelText("Item 1, ex.: Convite personalizado"), {
      target: { value: "Convites" },
    });
    fireEvent.change(screen.getByLabelText("Qtd."), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Preço un."), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByText("Continuar"));

    expect(screen.queryByText("Revisar orçamento")).toBeNull();
  });
});
