import { describe, expect, it } from "vitest";
import { parseDecimalInput } from "./calculator-input";
describe("decimal input", () => {
  it("preserves sequential comma input including the intermediate separator", () => {
    expect(["1", "12", "12,", "12,5", "12,50"].map(parseDecimalInput)).toEqual([
      1, 12, 12, 12.5, 12.5,
    ]);
  });
  it("accepts pasted comma/dot values and surrounding whitespace", () => {
    expect(parseDecimalInput(" 12,50 ")).toBe(12.5);
    expect(parseDecimalInput("12.50")).toBe(12.5);
    expect(parseDecimalInput("1.234,56")).toBe(1234.56);
    expect(parseDecimalInput("12.345.678,90")).toBe(12345678.9);
    expect(parseDecimalInput("0")).toBe(0);
    expect(parseDecimalInput("")).toBe(0);
  });
  it("rejects ambiguous or nonnumeric text instead of stripping separators", () => {
    for (const value of ["1.23,45", "12,50,0", "R$ 12,50", "Infinity", "1e3", ","])
      expect(Number.isNaN(parseDecimalInput(value))).toBe(true);
    expect(parseDecimalInput("-1")).toBe(-1);
  });
});
