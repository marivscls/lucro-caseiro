import type { CreateMaterialData, UpdateMaterialData } from "./materials.types";

export function clampStock(value: number): number {
  return value < 0 ? 0 : value;
}

/**
 * Valida dados de insumo. Em update (`partial`), só checa os campos enviados.
 */
export function validateMaterial(
  data: CreateMaterialData | UpdateMaterialData,
  partial = false,
): string[] {
  const errors: string[] = [];

  if (!partial || data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push("O nome e obrigatorio");
    }
  }
  if (!partial || data.unit !== undefined) {
    if (!data.unit || data.unit.trim().length === 0) {
      errors.push("A unidade e obrigatoria");
    }
  }
  if (data.stockQuantity != null && data.stockQuantity < 0) {
    errors.push("A quantidade nao pode ser negativa");
  }
  if (data.stockAlertThreshold != null && data.stockAlertThreshold < 0) {
    errors.push("O alerta nao pode ser negativo");
  }
  if (data.costPerUnit != null && data.costPerUnit < 0) {
    errors.push("O custo nao pode ser negativo");
  }

  // #14: conteúdo por unidade — se um dos dois for informado, ambos sao obrigatorios.
  const hasContentPerUnit = data.contentPerUnit != null;
  const hasContentUnit = data.contentUnit != null && data.contentUnit.trim().length > 0;
  if (hasContentPerUnit || hasContentUnit) {
    if (!hasContentPerUnit || (data.contentPerUnit as number) <= 0) {
      errors.push("O conteudo por unidade deve ser maior que zero");
    }
    if (!hasContentUnit) {
      errors.push("A unidade de conteudo e obrigatoria");
    }
  }

  return errors;
}
