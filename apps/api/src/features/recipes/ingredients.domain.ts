import type { CreateIngredientData } from "./ingredients.types";

export function validateIngredientData(data: CreateIngredientData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome do ingrediente e obrigatorio");
  }

  if (data.name.length > 200) {
    errors.push("Nome do ingrediente deve ter no maximo 200 caracteres");
  }

  if (data.price <= 0) {
    errors.push("Preco deve ser maior que zero");
  }

  if (data.quantityPerPackage <= 0) {
    errors.push("Quantidade por embalagem deve ser maior que zero");
  }

  if (data.unit.trim().length === 0) {
    errors.push("Unidade e obrigatoria");
  }

  if (data.unit.length > 20) {
    errors.push("Unidade deve ter no maximo 20 caracteres");
  }

  return errors;
}

export function calculatePricePerUnit(price: number, quantityPerPackage: number): number {
  return price / quantityPerPackage;
}
