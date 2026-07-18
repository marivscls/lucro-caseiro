import { describe, expect, it } from "vitest";

import { createBrandScale } from "./brand-theme";

describe("createBrandScale", () => {
  it("keeps the brand primary at 500 and emits ten valid colors", () => {
    const scale = createBrandScale("#2E7D5B");
    expect(scale["500"]).toBe("#2E7D5B");
    expect(Object.values(scale)).toHaveLength(10);
    expect(Object.values(scale).every((color) => /^#[\da-f]{6}$/i.test(color))).toBe(
      true,
    );
  });
});
