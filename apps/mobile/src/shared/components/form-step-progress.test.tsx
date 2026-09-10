import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormStepProgress } from "./form-step-progress";

vi.mock("react-native", () => ({
  View: ({
    children,
    accessibilityRole,
    accessibilityValue,
  }: React.PropsWithChildren<{
    accessibilityRole?: string;
    accessibilityValue?: { min: number; max: number; now: number };
  }>) => (
    <div
      role={accessibilityRole}
      aria-valuemin={accessibilityValue?.min}
      aria-valuemax={accessibilityValue?.max}
      aria-valuenow={accessibilityValue?.now}
    >
      {children}
    </div>
  ),
  Pressable: ({
    children,
    onPress,
    disabled,
    accessibilityLabel,
  }: React.PropsWithChildren<{
    onPress?: () => void;
    disabled?: boolean;
    accessibilityLabel?: string;
  }>) => (
    <button disabled={disabled} aria-label={accessibilityLabel} onClick={onPress}>
      {children}
    </button>
  ),
}));

vi.mock("@lucro-caseiro/ui", () => ({
  Typography: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  radii: { full: 999 },
  spacing: { xs: 4, sm: 8, md: 12 },
  useTheme: () => ({
    theme: {
      colors: {
        border: "gray",
        primary: "wine",
        primaryBg: "pink",
        text: "black",
        textSecondary: "dimgray",
      },
    },
  }),
}));

afterEach(cleanup);

const steps = [
  { label: "Dados", title: "Dados principais" },
  { label: "Detalhes", title: "Detalhes do cadastro" },
  { label: "Revisão", title: "Revisar e salvar" },
] as const;

describe("FormStepProgress", () => {
  it("describes the current step with its name", () => {
    render(<FormStepProgress current={2} steps={steps} />);

    expect(screen.getByText("Etapa 2 de 3")).toBeDefined();
    expect(screen.getByText("Detalhes do cadastro")).toBeDefined();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
  });

  it("allows returning only to completed steps", () => {
    const onStepPress = vi.fn();
    render(<FormStepProgress current={2} steps={steps} onStepPress={onStepPress} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Voltar para etapa 1: Dados principais" }),
    );
    expect(onStepPress).toHaveBeenCalledWith(1);
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Etapa 3: Revisar e salvar",
      }).disabled,
    ).toBe(true);
  });
});
