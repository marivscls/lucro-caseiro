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

  it("accepts both content fields together", () => {
    expect(
      validateMaterial({
        name: "Leite condensado",
        unit: "lata",
        contentPerUnit: 350,
        contentUnit: "ml",
      }),
    ).toEqual([]);
  });

  it("accepts material without any content info", () => {
    expect(validateMaterial({ name: "Farinha", unit: "kg" })).toEqual([]);
  });

  it("requires the content unit when only contentPerUnit is given", () => {
    const errors = validateMaterial({
      name: "Leite condensado",
      unit: "lata",
      contentPerUnit: 350,
    });
    expect(errors).toContain("A unidade de conteudo e obrigatoria");
  });

  it("requires a positive contentPerUnit when only contentUnit is given", () => {
    const errors = validateMaterial({
      name: "Leite condensado",
      unit: "lata",
      contentUnit: "ml",
    });
    expect(errors).toContain("O conteudo por unidade deve ser maior que zero");
  });

  it("rejects non-positive contentPerUnit", () => {
    const errors = validateMaterial({
      name: "Leite condensado",
      unit: "lata",
      contentPerUnit: 0,
      contentUnit: "ml",
    });
    expect(errors).toContain("O conteudo por unidade deve ser maior que zero");
  });
});

describe("clampStock", () => {
  it("clamps negatives to zero", () => {
    expect(clampStock(-3)).toBe(0);
    expect(clampStock(5)).toBe(5);
  });
});
