import { describe, expect, it } from "vitest";

import { formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("formats with comma decimals", () => {
    expect(formatCurrency(25)).toBe("R$ 25,00");
    expect(formatCurrency(3.5)).toBe("R$ 3,50");
  });
  it("adds thousand separators", () => {
    expect(formatCurrency(1234.56)).toBe("R$ 1.234,56");
    expect(formatCurrency(1234567.8)).toBe("R$ 1.234.567,80");
  });
  it("handles zero and negatives", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
    expect(formatCurrency(-10)).toBe("-R$ 10,00");
  });
});
