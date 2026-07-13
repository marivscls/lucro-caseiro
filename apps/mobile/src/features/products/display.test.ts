import { describe, expect, it } from "vitest";

import { productInitial } from "./display";

describe("productInitial", () => {
  it("uses the visible product name after a technical prefix", () => {
    expect(productInitial("[massa] Kit festa")).toBe("K");
  });

  it("uses the regular first letter", () => {
    expect(productInitial("Coxinha")).toBe("C");
  });
});
