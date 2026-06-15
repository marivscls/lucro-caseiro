import type { NutritionFacts } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { cleanNutrition, hasNutrition } from "./nutrition";

describe("hasNutrition", () => {
  it("retorna false para null/undefined ou objeto vazio", () => {
    expect(hasNutrition(null)).toBe(false);
    expect(hasNutrition()).toBe(false);
    expect(hasNutrition({})).toBe(false);
  });

  it("retorna false quando todos os campos sao so espacos", () => {
    expect(hasNutrition({ calories: "   ", protein: "" })).toBe(false);
  });

  it("retorna true quando ha ao menos um campo preenchido", () => {
    expect(hasNutrition({ calories: "120 kcal" })).toBe(true);
  });
});

describe("cleanNutrition", () => {
  it("retorna undefined quando vazio (nao envia nutrition em branco)", () => {
    expect(cleanNutrition(null)).toBeUndefined();
    expect(cleanNutrition({})).toBeUndefined();
    expect(cleanNutrition({ protein: "  " })).toBeUndefined();
  });

  it("mantem o objeto quando ha algum valor", () => {
    const nutrition: NutritionFacts = { protein: "2 g" };
    expect(cleanNutrition(nutrition)).toBe(nutrition);
  });
});
