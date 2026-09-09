import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationField } from "../../../../../packages/ui/src/components/validation-field";
import { CenteredTextInput } from "../../../../../packages/ui/src/components/centered-text-input";
import { useFormValidation } from "../hooks/use-form-validation";

vi.mock("react-native", async () => vi.importActual("react-native-web"));

function Form({ onSave }: Readonly<{ onSave: (name: string) => void }>) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const validation = useFormValidation({
    name: !name.trim() && "Informe o nome.",
    category: !category && "Selecione uma categoria.",
  });
  return (
    <>
      <ValidationField {...validation.field("name")}>
        <CenteredTextInput
          accessibilityLabel="Nome"
          value={name}
          onChangeText={setName}
        />
      </ValidationField>
      <ValidationField {...validation.field("category")}>
        <button type="button" onClick={() => setCategory("Doces")}>
          Escolher categoria
        </button>
      </ValidationField>
      <button
        type="button"
        onClick={() => {
          if (validation.validate()) onSave(name);
        }}
      >
        Salvar
      </button>
    </>
  );
}

describe("required field feedback in the rendered form", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("announces errors and focuses the first empty input without saving or erasing values", () => {
    const save = vi.fn();
    render(<Form onSave={save} />);
    expect(screen.queryByText("Informe o nome.")).toBeNull();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "  " } });
    fireEvent.click(screen.getByText("Salvar"));
    act(() => {
      vi.runAllTimers();
    });
    const name = screen.getByLabelText<HTMLInputElement>("Nome");
    expect(document.activeElement).toBe(name);
    expect(name.value).toBe("  ");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(name.getAttribute("aria-describedby")!)?.textContent,
    ).toBe("Informe o nome.");
    expect(screen.getByRole("alert").textContent).toContain("antes de continuar");
    expect(save).not.toHaveBeenCalled();

    fireEvent.change(name, { target: { value: "Bolo" } });
    expect(screen.queryByText("Informe o nome.")).toBeNull();
    expect(name.getAttribute("aria-invalid")).not.toBe("true");
    fireEvent.click(screen.getByText("Salvar"));
    act(() => {
      vi.runAllTimers();
    });
    expect(document.activeElement).toBe(screen.getByText("Escolher categoria"));
    fireEvent.click(screen.getByText("Escolher categoria"));
    fireEvent.click(screen.getByText("Salvar"));
    expect(save).toHaveBeenCalledWith("Bolo");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
