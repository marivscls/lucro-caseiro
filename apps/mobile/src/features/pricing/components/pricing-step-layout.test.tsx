import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PricingStepLayout } from "./pricing-step-layout";
import type { PricingStep } from "../use-pricing-draft";

type MockViewProps = React.PropsWithChildren<{
  style?: React.CSSProperties;
  accessibilityLabel?: string;
  accessibilityElementsHidden?: boolean;
}>;
type MockButtonProps = React.PropsWithChildren<{
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}>;

vi.mock("react-native", () => ({
  View: ({
    children,
    style,
    accessibilityLabel,
    accessibilityElementsHidden,
  }: MockViewProps) => (
    <div
      aria-label={accessibilityLabel}
      hidden={accessibilityElementsHidden}
      style={style}
    >
      {children}
    </div>
  ),
  Pressable: ({ children, onPress, disabled, accessibilityLabel }: MockButtonProps) => (
    <button disabled={disabled} aria-label={accessibilityLabel} onClick={onPress}>
      {children}
    </button>
  ),
  Keyboard: { dismiss: vi.fn() },
  AccessibilityInfo: { announceForAccessibility: vi.fn() },
}));
vi.mock("@lucro-caseiro/ui", () => ({
  Typography: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  Button: ({ title, onPress, disabled, loading }: MockButtonProps) => (
    <button disabled={disabled || loading} onClick={onPress}>
      {title}
    </button>
  ),
  useTheme: () => ({
    theme: {
      mode: "light",
      colors: { background: "white", border: "gray", textSecondary: "gray" },
    },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
  radii: { md: 12 },
}));
vi.mock("../../../shared/brand-palette", () => ({
  useBrandScreenPalette: () => ({ wine: "#4A2332", wineFill: "#4A2332" }),
}));
vi.mock("../../../shared/components/keyboard-aware-scroll-view", () => ({
  KeyboardAwareScrollView: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));
vi.mock("../../../shared/layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));

afterEach(cleanup);

function Detail() {
  const [text, setText] = useState("");
  return (
    <input
      aria-label="Tempo do lote"
      value={text}
      onChange={(event) => setText(event.target.value)}
    />
  );
}
function Harness({ saving = false, onSave = vi.fn() }) {
  const [step, setStep] = useState<PricingStep>(1);
  return (
    <PricingStepLayout
      step={step}
      onStepChange={setStep}
      saving={saving}
      onNext={() => (step === 3 ? onSave() : setStep((step + 1) as PricingStep))}
    >
      {[
        <input key="cost" aria-label="Custo" />,
        <Detail key="details" />,
        <input key="profit" aria-label="Ganho" />,
      ]}
    </PricingStepLayout>
  );
}
describe("pricing step navigation", () => {
  it("shows one step at a time and preserves unsubmitted detail values", () => {
    render(<Harness />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tempo do lote" }), {
      target: { value: "45" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Ganho" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(
      screen.getByRole<HTMLInputElement>("textbox", { name: "Tempo do lote" }).value,
    ).toBe("45");
  });
  it("cannot skip directly to a future step", () => {
    render(<Harness />);
    const target = screen.getByRole<HTMLButtonElement>("button", {
      name: "Etapa 3: Preço e resultado",
    });
    expect(target.disabled).toBe(true);
    fireEvent.click(target);
    expect(screen.getByRole("textbox", { name: "Custo" })).toBeDefined();
  });
  it("saves only through the final action and disables navigation while saving", () => {
    const onSave = vi.fn();
    const { rerender } = render(<Harness onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar cálculo" }));
    expect(onSave).toHaveBeenCalledOnce();
    rerender(<Harness onSave={onSave} saving />);
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Salvar cálculo" }).disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Voltar" }).disabled,
    ).toBe(true);
  });
});
