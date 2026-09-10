import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CenteredTextInput } from "../../../../../packages/ui/src/components/centered-text-input";
import { maskCurrencyInput } from "../utils/currency-input";
import { maskDateBR } from "../utils/date";
import { maskPhoneBR } from "../utils/phone";

vi.mock("react-native", async () => vi.importActual("react-native-web"));

afterEach(cleanup);

function Field({
  mode,
  initial = "",
  mask = (text: string) => text,
}: Readonly<{
  mode?: "integer" | "decimal" | "signed-decimal";
  initial?: string;
  mask?: (text: string) => string;
}>) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <CenteredTextInput
        accessibilityLabel="Campo"
        value={value}
        numericMode={mode}
        onChangeText={(text) => setValue(mask(text))}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

describe("numeric input rules", () => {
  it("allows negative price adjustments only in signed decimal fields", () => {
    render(<Field mode="signed-decimal" />);
    const input = screen.getByLabelText<HTMLInputElement>("Campo");
    for (const text of ["-", "-5", "-5,5"]) {
      fireEvent.change(input, { target: { value: text } });
      expect(input.value).toBe(text);
    }
    for (const text of ["5-5", "--5", "-abc"]) {
      fireEvent.change(input, { target: { value: text } });
      expect(input.value).toBe("-5,5");
    }
  });
  it.each(["sadasd", "12abc", "-12", "+12", "1e3", "0x10", "1,2.3", "1..2"])(
    "rejects typing or pasting %s without changing the existing quantity",
    (text) => {
      render(<Field mode="decimal" initial="12" />);
      const input = screen.getByLabelText<HTMLInputElement>("Campo");
      fireEvent.change(input, { target: { value: text } });
      expect(input.value).toBe("12");
      expect(screen.getByTestId("value").textContent).toBe("12");
    },
  );

  it.each(["", "0", "30", "1,5", "1.5", ",5", "0,", "2."])(
    "allows decimal editing with %s",
    (text) => {
      render(<Field mode="decimal" initial="12" />);
      const input = screen.getByLabelText<HTMLInputElement>("Campo");
      fireEvent.change(input, { target: { value: text } });
      expect(input.value).toBe(text);
      expect(screen.getByTestId("value").textContent).toBe(text);
    },
  );

  it("keeps integer quantities editable and rejects decimal quantities", () => {
    render(<Field mode="integer" />);
    const input = screen.getByLabelText<HTMLInputElement>("Campo");
    for (const text of ["3", "30", ""]) {
      fireEvent.change(input, { target: { value: text } });
      expect(input.value).toBe(text);
    }
    for (const text of ["palavras", "1,5", "1.5", "-2"]) {
      fireEvent.change(input, { target: { value: text } });
      expect(input.value).toBe("");
      expect(screen.getByTestId("value").textContent).toBe("");
    }
  });

  it("preserves text fields", () => {
    render(<Field />);
    fireEvent.change(screen.getByLabelText("Campo"), {
      target: { value: "Bolo de fubá" },
    });
    expect(screen.getByTestId("value").textContent).toBe("Bolo de fubá");
  });

  it.each([
    [maskCurrencyInput, "123456", "1.234,56"],
    [maskDateBR, "10092026", "10/09/2026"],
    [maskPhoneBR, "11999999999", "(11) 99999-9999"],
  ] as const)("preserves existing masks", (mask, text, expected) => {
    render(<Field mask={mask} />);
    const input = screen.getByLabelText<HTMLInputElement>("Campo");
    fireEvent.change(input, { target: { value: text } });
    expect(input.value).toBe(expected);
  });
});
