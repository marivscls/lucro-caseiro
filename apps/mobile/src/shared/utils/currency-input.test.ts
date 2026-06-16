import { describe, expect, it } from "vitest";

import { currencyInput, maskCurrencyInput, parseCurrencyInput } from "./currency-input";

describe("maskCurrencyInput", () => {
  it("formata digitos como moeda BR (centavos)", () => {
    expect(maskCurrencyInput("350")).toBe("3,50");
    expect(maskCurrencyInput("5")).toBe("0,05");
  });

  it("adiciona separador de milhar", () => {
    expect(maskCurrencyInput("123456")).toBe("1.234,56");
    expect(maskCurrencyInput("100000")).toBe("1.000,00");
  });

  it("ignora caracteres nao numericos", () => {
    expect(maskCurrencyInput("R$ 1.000,00")).toBe("1.000,00");
  });

  it("retorna vazio quando nao ha digitos", () => {
    expect(maskCurrencyInput("")).toBe("");
    expect(maskCurrencyInput("abc")).toBe("");
  });

  it("limita a 10 digitos de entrada", () => {
    // 12 digitos -> usa os 10 primeiros (1234567890 centavos)
    expect(maskCurrencyInput("123456789012")).toBe("12.345.678,90");
  });
});

describe("parseCurrencyInput", () => {
  it("converte texto mascarado em numero", () => {
    expect(parseCurrencyInput("3,50")).toBe(3.5);
    expect(parseCurrencyInput("1.234,56")).toBe(1234.56);
  });

  it("retorna NaN para texto vazio", () => {
    expect(Number.isNaN(parseCurrencyInput(""))).toBe(true);
  });
});

describe("currencyInput", () => {
  it("formata um numero como moeda mascarada", () => {
    expect(currencyInput(3.5)).toBe("3,50");
    expect(currencyInput(1234.56)).toBe("1.234,56");
    expect(currencyInput(0)).toBe("0,00");
  });

  it("faz ida e volta com parseCurrencyInput", () => {
    expect(parseCurrencyInput(currencyInput(1234.56))).toBe(1234.56);
    expect(parseCurrencyInput(currencyInput(7.89))).toBe(7.89);
  });
});
