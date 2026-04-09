import type { LabelData } from "@lucro-caseiro/contracts";

import type { CreateLabelData } from "./labels.types";

export interface LabelTemplate {
  id: string;
  name: string;
}

const TEMPLATES: LabelTemplate[] = [
  { id: "classico", name: "Classico" },
  { id: "moderno", name: "Moderno" },
  { id: "minimalista", name: "Minimalista" },
  { id: "artesanal", name: "Artesanal" },
  { id: "gourmet", name: "Gourmet" },
];

export function validateLabelData(data: CreateLabelData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome do rotulo e obrigatorio");
  }

  if (data.name.length > 200) {
    errors.push("Nome do rotulo deve ter no maximo 200 caracteres");
  }

  if (!data.templateId || data.templateId.trim().length === 0) {
    errors.push("Template e obrigatorio");
  } else if (!isValidTemplate(data.templateId)) {
    errors.push("Template invalido");
  }

  return errors;
}

export function getAvailableTemplates(): LabelTemplate[] {
  return [...TEMPLATES];
}

export function isValidTemplate(templateId: string): boolean {
  return TEMPLATES.some((t) => t.id === templateId);
}

export function buildLabelContent(
  data: LabelData,
  recipe?: { ingredients: string },
): LabelData {
  if (recipe?.ingredients && !data.ingredients) {
    return { ...data, ingredients: recipe.ingredients };
  }
  return { ...data };
}
