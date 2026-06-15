import { describe, expect, it } from "vitest";

import { INGREDIENT_CATALOG } from "./catalog";
import { ingredientSlug, normalizeName, resolveIngredient, slugify } from "./resolve";

const slugOf = (name: string) => resolveIngredient(name)?.slug ?? null;

describe("normalizeName", () => {
  it("remove acento, número, unidade, parênteses e stopword", () => {
    expect(normalizeName("Açúcar Refinado!")).toBe("acucar refinado");
    expect(normalizeName("Leite Condensado Moça 395g")).toBe("leite condensado moca");
    expect(normalizeName("Caixa para bolo")).toBe("caixa bolo");
    expect(normalizeName("")).toBe("");
  });
});

describe("resolveIngredient", () => {
  it("casa nomes diretos", () => {
    expect(slugOf("Açúcar refinado")).toBe("acucar");
    expect(slugOf("Chocolate em pó")).toBe("chocolate-em-po");
    expect(slugOf("Caixa para bolo")).toBe("caixa");
  });

  it("casa por alias / palavra-chave", () => {
    expect(slugOf("Farinha de trigo")).toBe("farinha-de-trigo");
    expect(slugOf("Trigo")).toBe("farinha-de-trigo");
    expect(slugOf("Leite integral")).toBe("leite");
  });

  it("prefere o alias mais específico (leite condensado > leite)", () => {
    expect(slugOf("Leite Condensado Moça 395g")).toBe("leite-condensado");
  });

  it("retorna null sem correspondência", () => {
    expect(slugOf("Foguete espacial")).toBeNull();
    expect(slugOf("")).toBeNull();
  });

  it("toda entrada resolve para si mesma pelo label", () => {
    for (const entry of INGREDIENT_CATALOG) {
      expect(resolveIngredient(entry.label), entry.label).not.toBeNull();
    }
  });
});

describe("slugify / ingredientSlug (dinâmico)", () => {
  it("slugify é puro (não consulta o catálogo)", () => {
    expect(slugify("Lasanha à Bolonhesa")).toBe("lasanha-a-bolonhesa");
    expect(slugify("Torta de limão")).toBe("torta-limao");
    expect(slugify("Coxinha")).toBe("coxinha");
  });

  it("ingredientSlug usa o catálogo quando casa", () => {
    expect(ingredientSlug("Açúcar refinado")).toBe("acucar");
    expect(ingredientSlug("Leite condensado")).toBe("leite-condensado");
  });

  it("ingredientSlug deriva do nome quando não casa no catálogo", () => {
    expect(ingredientSlug("Lasanha")).toBe("lasanha");
    expect(ingredientSlug("Coxinha")).toBe("coxinha");
  });
});
