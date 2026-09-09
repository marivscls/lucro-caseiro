import { describe, expect, it } from "vitest";
import { pricingProductInitialValues } from "./pricing-initial-values";

describe("pricingProductInitialValues", () => {
  it("keeps calculated costs and recipe identity for the new product", () => {
    expect(
      pricingProductInitialValues({
        create: "from-pricing",
        salePrice: "18.5",
        costPrice: "7.25",
        name: "Bolo de cenoura",
        category: "Bolos",
      }),
    ).toEqual({
      salePrice: 18.5,
      costPrice: 7.25,
      name: "Bolo de cenoura",
      category: "Bolos",
    });
  });

  it("does not apply pricing values to a manual creation", () => {
    expect(
      pricingProductInitialValues({
        salePrice: "18.5",
        costPrice: "7.25",
        name: "Antigo",
      }),
    ).toBeUndefined();
  });

  it.each(["NaN", "Infinity", "-10", " ", "abc"])(
    "ignores invalid monetary route values: %s",
    (value) => {
      expect(
        pricingProductInitialValues({
          create: "from-pricing",
          salePrice: value,
          costPrice: value,
        }),
      ).toEqual({
        salePrice: undefined,
        costPrice: undefined,
        name: undefined,
        category: undefined,
      });
    },
  );

  it("preserves a known zero cost and leaves missing identity blank", () => {
    expect(
      pricingProductInitialValues({ create: "from-pricing", costPrice: "0" }),
    ).toEqual({
      salePrice: undefined,
      costPrice: 0,
      name: undefined,
      category: undefined,
    });
  });
});
