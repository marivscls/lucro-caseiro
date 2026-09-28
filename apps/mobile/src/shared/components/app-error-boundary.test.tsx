import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "./app-error-boundary";

let shouldThrow = true;

function Fragile() {
  if (shouldThrow) throw new TypeError("dado sensível");
  return <p>Tela recuperada</p>;
}

function Harness({ onError }: Readonly<{ onError: (error: unknown) => void }>) {
  return (
    <AppErrorBoundary
      onError={onError}
      renderFallback={(reset) => (
        <button type="button" onClick={reset}>
          Tentar de novo
        </button>
      )}
    >
      <Fragile />
    </AppErrorBoundary>
  );
}

describe("AppErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    shouldThrow = true;
    vi.restoreAllMocks();
  });

  it("mostra a tela amigável, relata o erro e volta ao conteúdo ao tentar de novo", () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onError = vi.fn();
    render(<Harness onError={onError} />);

    // Act
    const retry = screen.getByRole("button", { name: "Tentar de novo" });
    shouldThrow = false;
    fireEvent.click(retry);

    // Assert
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(TypeError);
    expect(screen.getByText("Tela recuperada")).toBeTruthy();
  });

  it("mantém a tela amigável mesmo se o relato do erro falhar", () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onError = vi.fn(() => {
      throw new Error("coleta indisponível");
    });

    // Act
    render(<Harness onError={onError} />);

    // Assert
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeTruthy();
  });
});
