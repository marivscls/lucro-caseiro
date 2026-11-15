import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FinanceHistoryNote } from "./finance-history-note";

vi.mock("react-native", async () => vi.importActual("react-native-web"));
vi.mock("@lucro-caseiro/ui", async () =>
  vi.importActual("../../../../../../packages/ui/src/index"),
);
vi.mock("../../../../../../packages/ui/src/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

afterEach(cleanup);

describe("FinanceHistoryNote", () => {
  it("explica que o Gratuito mostra só a semana atual", () => {
    // Arrange / Act
    render(<FinanceHistoryNote weekLabel="16 a 22 de nov." onUpgrade={vi.fn()} />);

    // Assert
    expect(screen.getByText("Esta semana: 16 a 22 de nov.")).toBeTruthy();
    expect(
      screen.getByText(
        "No plano gratuito você vê a semana atual. Veja meses anteriores no Premium.",
      ),
    ).toBeTruthy();
  });

  it("abre o Premium pelo botão de meses anteriores", () => {
    // Arrange
    const onUpgrade = vi.fn();
    render(<FinanceHistoryNote weekLabel="16 a 22 de nov." onUpgrade={onUpgrade} />);

    // Act
    fireEvent.click(screen.getByLabelText("Ver meses anteriores no Premium"));

    // Assert
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });
});
