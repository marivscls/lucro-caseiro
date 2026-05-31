import type { CreateProductData } from "./products.types";

export function validateProductData(data: CreateProductData): string[] {
  const errors: string[] = [];

  if (data.salePrice <= 0) {
    errors.push("Preço de venda deve ser maior que zero");
  }

  if (data.name.trim().length === 0) {
    errors.push("Nome do produto é obrigatório");
  }

  if (data.name.length > 200) {
    errors.push("Nome do produto deve ter no máximo 200 caracteres");
  }

  if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
    errors.push("Quantidade em estoque não pode ser negativa");
  }

  if (data.stockAlertThreshold !== undefined && data.stockAlertThreshold < 0) {
    errors.push("Alerta de estoque não pode ser negativo");
  }

  return errors;
}

/**
 * Custo de um produto composto (kit/caixinha): soma de (custo do componente x quantidade).
 * Componentes sem custo conhecido (costPrice null) contam como 0.
 */
export function calculateCompositeCost(
  components: { costPrice: number | null; quantity: number }[],
): number {
  return components.reduce((sum, c) => sum + (c.costPrice ?? 0) * c.quantity, 0);
}

/**
 * Valida os componentes informados ao criar/atualizar um produto composto.
 * Regras (MVP): >= 1 componente; quantidade > 0; nao pode referenciar a si mesmo.
 * Nota: a verificacao de "componente nao-composto" e "pertence ao mesmo usuario"
 * exige buscar os produtos no banco, entao e feita nos usecases.
 */
export function validateCompositeComponents(
  productId: string | undefined,
  components: { componentProductId: string; quantity: number }[],
): string[] {
  const errors: string[] = [];

  if (components.length === 0) {
    errors.push("Um produto composto precisa de pelo menos um componente");
  }

  if (components.some((c) => c.quantity <= 0)) {
    errors.push("A quantidade de cada componente deve ser maior que zero");
  }

  if (productId && components.some((c) => c.componentProductId === productId)) {
    errors.push("Um produto não pode ser componente dele mesmo");
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
