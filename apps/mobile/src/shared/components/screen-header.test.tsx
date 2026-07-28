import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRouter = vi.hoisted(() => ({
  back: vi.fn(),
  canGoBack: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("react-native", () => ({
  Pressable: ({
    accessibilityLabel,
    children,
    onPress,
  }: {
    accessibilityLabel?: string;
    children?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <button aria-label={accessibilityLabel} onClick={onPress} type="button">
      {children}
    </button>
  ),
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@lucro-caseiro/ui", () => ({
  iconSizes: { md: 24 },
  spacing: { sm: 8, md: 12, lg: 16 },
  Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  useTheme: () => ({ theme: { colors: { text: "#222" } } }),
}));

vi.mock("./app-icon", () => ({
  AppIcon: () => null,
}));

vi.mock("../layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));

import { ScreenHeader } from "./screen-header";

describe("ScreenHeader", () => {
  beforeEach(() => {
    mockRouter.back.mockReset();
    mockRouter.canGoBack.mockReset();
    mockRouter.replace.mockReset();
  });

  afterEach(cleanup);

  it("volta pelo histórico quando ele existe", () => {
    mockRouter.canGoBack.mockReturnValue(true);
    render(<ScreenHeader title="Agenda" />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(mockRouter.back).toHaveBeenCalledOnce();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("vai para Mais quando a tela foi aberta sem histórico", () => {
    mockRouter.canGoBack.mockReturnValue(false);
    render(<ScreenHeader title="Métricas do produto" />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/tabs/more");
  });

  it("respeita o destino alternativo da tela", () => {
    mockRouter.canGoBack.mockReturnValue(false);
    render(<ScreenHeader title="Agenda" fallbackRoute="/tabs" />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(mockRouter.replace).toHaveBeenCalledWith("/tabs");
  });

  it("prioriza a ação de retorno definida pela tela", () => {
    const onBack = vi.fn();
    render(<ScreenHeader title="Clientes" onBack={onBack} />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(mockRouter.canGoBack).not.toHaveBeenCalled();
  });

  it("mantém título e subtítulo quando o voltar está oculto", () => {
    render(
      <ScreenHeader
        title="Financeiro"
        subtitle="Acompanhe seu lucro e fluxo financeiro"
        hideBack
      />,
    );

    expect(screen.getByText("Financeiro")).toBeTruthy();
    expect(
      screen.getByText("Acompanhe seu lucro e fluxo financeiro"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Voltar" })).toBeNull();
  });

  it("não encolhe o título quando há ações à direita", () => {
    render(
      <ScreenHeader
        title="Insumos"
        hideBack
        right={<button type="button">Buscar</button>}
      />,
    );

    expect(screen.getByText("Insumos")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy();
  });
});
