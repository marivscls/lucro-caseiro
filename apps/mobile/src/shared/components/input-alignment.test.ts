import { describe, expect, it } from "vitest";
import { centeredTextPadding } from "../../../../../packages/ui/src/components/text-input-alignment";

describe("vertical text alignment", () => {
  it("centers one line in the finance description field", () => {
    expect(centeredTextPadding(50, 22)).toBe(14);
  });

  it("recalculates the inset when text wraps to multiple lines", () => {
    expect(centeredTextPadding(100, 44)).toBe(28);
    expect(centeredTextPadding(100, 66)).toBe(17);
  });

  it("leaves all text reachable by scrolling when content fills or exceeds the field", () => {
    expect(centeredTextPadding(66, 66)).toBe(0);
    expect(centeredTextPadding(50, 132)).toBe(0);
  });

  it("does not add an inset while a hidden modal has no layout", () => {
    expect(centeredTextPadding(0, 22)).toBe(0);
  });
});
