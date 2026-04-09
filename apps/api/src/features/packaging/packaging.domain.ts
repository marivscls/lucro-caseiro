import type { CreatePackagingData } from "./packaging.types";

export function validatePackagingData(data: CreatePackagingData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome da embalagem e obrigatorio");
  }

  if (data.name.length > 200) {
    errors.push("Nome da embalagem deve ter no maximo 200 caracteres");
  }

  if (data.unitCost <= 0) {
    errors.push("Custo unitario deve ser maior que zero");
  }

  return errors;
}
