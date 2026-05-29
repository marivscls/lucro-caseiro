import { describe, expect, it } from "vitest";

import { clampStock, validateMaterial } from "./materials.domain";

describe("validateMaterial", () => {
  it("accepts valid data", () => {
    expect(validateMaterial({ name: "Farinha", unit: "kg" })).toEqual([]);
  });

  it("requires name and unit on create", () => {
    const errors = validateMaterial({ name: "", unit: "" });
    expect(errors).toContain("O nome e obrigatorio");
    expect(errors).toContain("A unidade e obrigatoria");
  });

  it("rejects negative numbers", () => {
    const errors = validateMaterial({
      name: "Açúcar",
      unit: "kg",
      stockQuantity: -1,
      stockAlertThreshold: -2,
      costPerUnit: -3,
    });
    expect(errors).toHaveLength(3);
  });

  it("in partial mode only checks provided fields", () => {
    expect(validateMaterial({ costPerUnit: 5 }, true)).toEqual([]);
    expect(validateMaterial({ unit: "" }, true)).toContain("A unidade e obrigatoria");
  });
});

describe("clampStock", () => {
  it("clamps negatives to zero", () => {
    expect(clampStock(-3)).toBe(0);
    expect(clampStock(5)).toBe(5);
  });
});
