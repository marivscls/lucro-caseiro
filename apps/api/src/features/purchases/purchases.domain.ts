import type { CreatePurchaseData } from "./purchases.types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePurchaseData(data: CreatePurchaseData): string[] {
  const errors: string[] = [];

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Descrição é obrigatória");
  }

  if (data.description && data.description.length > 500) {
    errors.push("Descrição deve ter no máximo 500 caracteres");
  }

  if (
    (data.amount === undefined || data.amount <= 0 || Number.isNaN(data.amount)) &&
    !data.items?.length
  ) {
    errors.push("Valor deve ser maior que zero");
  }

  if (
    data.items?.some(
      (item) =>
        item.quantity <= 0 || !Number.isInteger(item.quantity) || item.unitCost < 0,
    )
  ) {
    errors.push("Itens da compra têm quantidade ou custo inválido");
  }

  if (!data.purchasedAt || !ISO_DATE.test(data.purchasedAt)) {
    errors.push("Data da compra inválida");
  }

  if (data.dueDate != null && data.dueDate !== "" && !ISO_DATE.test(data.dueDate)) {
    errors.push("Data de vencimento inválida");
  }

  return errors;
}

/** Hoje em ISO (YYYY-MM-DD) — data do lançamento no caixa ao pagar. */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
