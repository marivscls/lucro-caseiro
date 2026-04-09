import type { CreateProductData } from "./products.types";

export function validateProductData(data: CreateProductData): string[] {
  const errors: string[] = [];

  if (data.salePrice <= 0) {
    errors.push("Preco de venda deve ser maior que zero");
  }

  if (data.name.trim().length === 0) {
    errors.push("Nome do produto e obrigatorio");
  }

  if (data.name.length > 200) {
    errors.push("Nome do produto deve ter no maximo 200 caracteres");
  }

  if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
    errors.push("Quantidade em estoque nao pode ser negativa");
  }

  if (data.stockAlertThreshold !== undefined && data.stockAlertThreshold < 0) {
    errors.push("Alerta de estoque nao pode ser negativo");
  }

  return errors;
}

export function isLowStock(quantity: number | null, threshold: number | null): boolean {
  if (quantity === null || threshold === null) return false;
  return quantity <= threshold;
}

export function calculateStockStatus(
  quantity: number | null,
  threshold: number | null,
): "ok" | "low" | "out" | "untracked" {
  if (quantity === null) return "untracked";
  if (quantity === 0) return "out";
  if (isLowStock(quantity, threshold)) return "low";
  return "ok";
}
