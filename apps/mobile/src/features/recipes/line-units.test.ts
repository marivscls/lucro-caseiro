import {
  materialCostPerLineUnit,
  materialLineUnitOptions,
} from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { recipeLineSummary } from "./domain";

describe("unidades da linha da ficha de custo", () => {
  it("oferece g para insumo em kg, sem conteúdo cadastrado", () => {
    expect(materialLineUnitOptions({ unit: "kg", contentUnit: null })).toEqual([
      "kg",
      "g",
    ]);
  });

  it("oferece a unidade irmã de g, L e ml", () => {
    expect(materialLineUnitOptions({ unit: "g", contentUnit: null })).toEqual([
      "g",
      "kg",
    ]);
    expect(materialLineUnitOptions({ unit: "L", contentUnit: null })).toEqual([
      "L",
      "ml",
    ]);
    expect(materialLineUnitOptions({ unit: "ml", contentUnit: null })).toEqual([
      "ml",
      "L",
    ]);
  });

  it("mantém uma opção só quando não há conversão (un, dz)", () => {
    expect(materialLineUnitOptions({ unit: "un", contentUnit: null })).toEqual(["un"]);
    expect(materialLineUnitOptions({ unit: "dz", contentUnit: "  " })).toEqual(["dz"]);
  });

  it("junta a unidade de conteúdo e a irmã dela, sem repetir", () => {
    expect(materialLineUnitOptions({ unit: "lata", contentUnit: "ml" })).toEqual([
      "lata",
      "ml",
      "L",
    ]);
    expect(materialLineUnitOptions({ unit: "kg", contentUnit: "G" })).toEqual([
      "kg",
      "G",
    ]);
  });

  it("calcula 200 g de um insumo de R$ 6,00 o kg como R$ 1,20", () => {
    const perGram = materialCostPerLineUnit(
      { unit: "kg", costPerUnit: 6, contentPerUnit: null, contentUnit: null },
      "g",
    );
    expect(perGram * 200).toBeCloseTo(1.2, 5);
  });

  it("mantém o custo quando a unidade da linha não tem conversão", () => {
    const cost = materialCostPerLineUnit(
      { unit: "un", costPerUnit: 4, contentPerUnit: null, contentUnit: null },
      "g",
    );
    expect(cost).toBe(4);
  });
});

describe("recipeLineSummary", () => {
  it("confirma a linha em palavras, com a unidade escolhida", () => {
    expect(recipeLineSummary("200", "g", "Farinha de trigo", "R$ 1,20")).toBe(
      "200 g de Farinha de trigo = R$ 1,20",
    );
  });

  it("mantém a vírgula digitada", () => {
    expect(recipeLineSummary(" 0,5 ", "kg", "Açúcar", "R$ 2,50")).toBe(
      "0,5 kg de Açúcar = R$ 2,50",
    );
  });

  it("não mostra frase sem quantidade válida", () => {
    expect(recipeLineSummary("", "g", "Farinha", "R$ 0,00")).toBeNull();
    expect(recipeLineSummary("abc", "g", "Farinha", "R$ 0,00")).toBeNull();
    expect(recipeLineSummary("0", "g", "Farinha", "R$ 0,00")).toBeNull();
  });
});
