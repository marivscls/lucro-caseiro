import { describe, expect, it } from "vitest";

import { displayProductName, productInitial, productNameMatchesSearch } from "./display";

describe("productInitial", () => {
  it("uses the visible product name after a technical prefix", () => {
    expect(productInitial("[massa] Kit festa")).toBe("K");
  });

  it("uses the regular first letter", () => {
    expect(productInitial("Coxinha")).toBe("C");
  });

  it("exposes the visible product name without technical prefixes", () => {
    expect(displayProductName("[massa] Kit festa")).toBe("Kit festa");
  });
});

describe("productNameMatchesSearch", () => {
  it("matches the visible name after a technical prefix", () => {
    expect(productNameMatchesSearch("[massa] Kit festa", "kit")).toBe(true);
    expect(productNameMatchesSearch("[massa] Kit festa", "massa")).toBe(true);
    expect(productNameMatchesSearch("[massa] Kit festa", "brownie")).toBe(false);
  });
});
