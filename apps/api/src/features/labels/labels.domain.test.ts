import { describe, expect, it } from "vitest";

import {
  buildLabelContent,
  getAvailableTemplates,
  isValidTemplate,
  validateLabelData,
} from "./labels.domain";
import type { CreateLabelData } from "./labels.types";

function makeLabelData(overrides: Partial<CreateLabelData> = {}): CreateLabelData {
  return {
    name: "Rotulo Brigadeiro",
    templateId: "classico",
    data: { productName: "Brigadeiro" },
    ...overrides,
  };
}

describe("validateLabelData", () => {
  it("returns empty array for valid data", () => {
    const errors = validateLabelData(makeLabelData());
    expect(errors).toEqual([]);
  });

  it("rejects empty name", () => {
    const errors = validateLabelData(makeLabelData({ name: "   " }));
    expect(errors).toContain("Nome do rotulo e obrigatorio");
  });

  it("rejects name over 200 chars", () => {
    const errors = validateLabelData(makeLabelData({ name: "a".repeat(201) }));
    expect(errors).toContain("Nome do rotulo deve ter no maximo 200 caracteres");
  });

  it("rejects empty templateId", () => {
    const errors = validateLabelData(makeLabelData({ templateId: "" }));
    expect(errors).toContain("Template e obrigatorio");
  });

  it("rejects invalid templateId", () => {
    const errors = validateLabelData(makeLabelData({ templateId: "inexistente" }));
    expect(errors).toContain("Template invalido");
  });

  it("accumulates multiple errors", () => {
    const errors = validateLabelData(makeLabelData({ name: "", templateId: "invalido" }));
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("getAvailableTemplates", () => {
  it("returns all 5 templates", () => {
    const templates = getAvailableTemplates();
    expect(templates).toHaveLength(5);
  });

  it("includes classico template", () => {
    const templates = getAvailableTemplates();
    expect(templates).toContainEqual({ id: "classico", name: "Classico" });
  });

  it("includes moderno template", () => {
    const templates = getAvailableTemplates();
    expect(templates).toContainEqual({ id: "moderno", name: "Moderno" });
  });

  it("includes minimalista template", () => {
    const templates = getAvailableTemplates();
    expect(templates).toContainEqual({ id: "minimalista", name: "Minimalista" });
  });

  it("includes artesanal template", () => {
    const templates = getAvailableTemplates();
    expect(templates).toContainEqual({ id: "artesanal", name: "Artesanal" });
  });

  it("includes gourmet template", () => {
    const templates = getAvailableTemplates();
    expect(templates).toContainEqual({ id: "gourmet", name: "Gourmet" });
  });

  it("returns a copy, not the original array", () => {
    const a = getAvailableTemplates();
    const b = getAvailableTemplates();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe("isValidTemplate", () => {
  it("returns true for valid template", () => {
    expect(isValidTemplate("classico")).toBe(true);
  });

  it("returns true for all known templates", () => {
    expect(isValidTemplate("moderno")).toBe(true);
    expect(isValidTemplate("minimalista")).toBe(true);
    expect(isValidTemplate("artesanal")).toBe(true);
    expect(isValidTemplate("gourmet")).toBe(true);
  });

  it("returns false for unknown template", () => {
    expect(isValidTemplate("inexistente")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidTemplate("")).toBe(false);
  });
});

describe("buildLabelContent", () => {
  it("returns data as-is when no recipe provided", () => {
    const data = { productName: "Brigadeiro" };
    const result = buildLabelContent(data);
    expect(result).toEqual({ productName: "Brigadeiro" });
  });

  it("merges recipe ingredients when data has no ingredients", () => {
    const data = { productName: "Brigadeiro" };
    const recipe = { ingredients: "Leite condensado, chocolate" };
    const result = buildLabelContent(data, recipe);
    expect(result.ingredients).toBe("Leite condensado, chocolate");
  });

  it("keeps existing ingredients when data already has them", () => {
    const data = { productName: "Brigadeiro", ingredients: "Ingredientes proprios" };
    const recipe = { ingredients: "Leite condensado, chocolate" };
    const result = buildLabelContent(data, recipe);
    expect(result.ingredients).toBe("Ingredientes proprios");
  });

  it("returns a new object, not the same reference", () => {
    const data = { productName: "Brigadeiro" };
    const result = buildLabelContent(data);
    expect(result).not.toBe(data);
    expect(result).toEqual(data);
  });
});
