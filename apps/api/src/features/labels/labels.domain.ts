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

export function normalizeLabelTemplateId(templateId: string): string {
  if (templateId === "classic") return "classico";
  if (templateId === "minimal") return "minimalista";
  return templateId;
}

export function validateLabelData(data: CreateLabelData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome da etiqueta é obrigatório");
  }

  if (data.name.length > 200) {
    errors.push("Nome da etiqueta deve ter no máximo 200 caracteres");
  }

  if (!data.templateId || data.templateId.trim().length === 0) {
    errors.push("Template é obrigatório");
  } else if (!isValidTemplate(data.templateId)) {
    errors.push("Template invalido");
  }

  const { manufacturingDate, expirationDate } = data.data;
  if (manufacturingDate && expirationDate && expirationDate < manufacturingDate) {
    errors.push("A validade não pode ser anterior à fabricação");
  }

  return errors;
}

export function getAvailableTemplates(): LabelTemplate[] {
  return [...TEMPLATES];
}

export function isValidTemplate(templateId: string): boolean {
  const normalizedId = normalizeLabelTemplateId(templateId);
  return TEMPLATES.some((t) => t.id === normalizedId);
}

/**
 * Mantem o contrato antigo legivel, mas impede clientes desatualizados de
 * persistirem ou receberem campos com aparencia de rotulagem tecnica.
 */
export function toSimpleLabelData(data: LabelData): LabelData {
  return {
    productName: data.productName,
    note: data.note,
    manufacturingDate: data.manufacturingDate,
    expirationDate: data.expirationDate,
    producerName: data.producerName,
    producerPhone: data.producerPhone,
    style: data.style,
  };
}
