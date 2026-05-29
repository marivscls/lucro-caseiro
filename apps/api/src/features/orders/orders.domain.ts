import type { OrderStatus } from "@lucro-caseiro/contracts";

import type { CreateOrderData, UpdateOrderData } from "./orders.types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const TERMINAL: OrderStatus[] = ["done", "cancelled"];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL.includes(status);
}

/**
 * Valida dados de encomenda. Em update (`partial`), só checa os campos enviados.
 */
export function validateOrder(
  data: CreateOrderData | UpdateOrderData,
  partial = false,
): string[] {
  const errors: string[] = [];

  if (!partial || data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push("O titulo e obrigatorio");
    } else if (data.title.length > 200) {
      errors.push("O titulo deve ter no maximo 200 caracteres");
    }
  }

  if (!partial || data.deliveryDate !== undefined) {
    if (!data.deliveryDate || !DATE_RE.test(data.deliveryDate)) {
      errors.push("Data de entrega invalida");
    }
  }

  if (data.deliveryTime != null && !TIME_RE.test(data.deliveryTime)) {
    errors.push("Horario invalido");
  }

  if (data.amount != null && data.amount < 0) {
    errors.push("O valor nao pode ser negativo");
  }

  return errors;
}

/** Hoje em YYYY-MM-DD (data local). */
export function todayISO(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
