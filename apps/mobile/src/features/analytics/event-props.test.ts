import { describe, expect, it } from "vitest";

import { sanitizeEventProps } from "./event-props";

describe("sanitizeEventProps", () => {
  it("mantém identificadores, números e booleanos válidos", () => {
    // Arrange
    const props = { plan: "essential", count: 3, trial: false };

    // Act
    const result = sanitizeEventProps(props);

    // Assert
    expect(result).toEqual(props);
  });

  it("descarta vazio, texto com espaço, chave inválida e número fora do limite", () => {
    // Arrange
    const props = {
      segment: "",
      name: "Maria da Silva",
      Bad: "x",
      huge: 1e12,
      nan: Number.NaN,
      ok: "sweets",
    };

    // Act
    const result = sanitizeEventProps(props);

    // Assert
    expect(result).toEqual({ ok: "sweets" });
  });

  it("corta texto longo, limita a cinco chaves e devolve undefined quando nada sobra", () => {
    // Arrange
    const props = { a: "x".repeat(80), b: 1, c: 2, d: 3, e: 4, f: 5 };

    // Act
    const result = sanitizeEventProps(props);

    // Assert
    expect(result).toEqual({ a: "x".repeat(64), b: 1, c: 2, d: 3, e: 4 });
    expect(sanitizeEventProps({ name: "com espaço" })).toBeUndefined();
    expect(sanitizeEventProps(undefined)).toBeUndefined();
  });
});
