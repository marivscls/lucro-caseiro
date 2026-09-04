import type { Product } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { createInternalProductCode, productMatchesSearch } from "./barcode";

const product = {
  name: "Caderno universitário",
  code: "7891234567890",
} as Product;

describe("productMatchesSearch", () => {
  it("encontra produto por nome ou codigo", () => {
    expect(productMatchesSearch(product, "caderno")).toBe(true);
    expect(productMatchesSearch(product, "7891234567890")).toBe(true);
    expect(productMatchesSearch(product, "caneta")).toBe(false);
  });

  it("encontra produto pelo nome visivel sem prefixo tecnico", () => {
    const seeded = { name: "[massa] Kit festa", code: null } as Product;
    expect(productMatchesSearch(seeded, "kit")).toBe(true);
    expect(productMatchesSearch(seeded, "festa")).toBe(true);
  });
});

describe("createInternalProductCode", () => {
  it("gera um codigo Code 39 compativel e deterministico", () => {
    expect(createInternalProductCode(1_700_000_000_000, 17)).toMatch(
      /^LC-[A-Z0-9]+-[A-Z0-9]{4}$/,
    );
  });
});
