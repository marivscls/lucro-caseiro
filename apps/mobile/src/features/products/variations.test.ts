import type { Product } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  availableProductStock,
  totalVariationStock,
  validateVariations,
} from "./variations";

describe("variações de produto", () => {
  it("soma apenas o estoque controlado das variações", () => {
    expect(
      totalVariationStock([
        { name: "Azul", stockQuantity: 3 },
        { name: "Rosa", stockQuantity: 5 },
        { name: "Verde" },
      ]),
    ).toBe(8);
  });

  it("usa o estoque do produto quando não há variações controladas", () => {
    const product = {
      stockQuantity: 12,
      variations: [],
    } as unknown as Product;
    expect(availableProductStock(product)).toBe(12);
  });

  it("rejeita nomes vazios, repetidos e estoque negativo", () => {
    expect(validateVariations([{ name: "" }])).toContain("nome");
    expect(validateVariations([{ name: "Azul" }, { name: " azul " }])).toContain(
      "repita",
    );
    expect(validateVariations([{ name: "Azul", stockQuantity: -1 }])).toContain(
      "negativo",
    );
  });
});
