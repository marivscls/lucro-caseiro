import type { OrderStatus } from "@lucro-caseiro/contracts";

import type {
  CreateOrderData,
  OrdersStatusAggregate,
  OrdersSummary,
  UpdateOrderData,
} from "./orders.types";

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

  if (data.deposit != null) {
    if (data.deposit < 0) {
      errors.push("O sinal nao pode ser negativo");
    } else if (data.amount != null && data.deposit > data.amount) {
      errors.push("O sinal nao pode ser maior que o valor da encomenda");
    }
  }

  if (data.amount != null && data.amount < 0) {
    errors.push("O valor nao pode ser negativo");
  }

  return errors;
}

/**
 * Monta o resumo agregado das encomendas a partir das linhas por status.
 * `cancelled` e ignorado (nao conta como receita/total). Semantica de PAGAMENTO:
 * `received` = soma dos sinais (deposit); `toReceive` = soma de (valor - sinal).
 * O sinal e validado para nunca exceder o valor, entao (amount - deposit) >= 0.
 */
export function buildOrdersSummary(rows: OrdersStatusAggregate[]): OrdersSummary {
  const summary: OrdersSummary = {
    totalOrders: 0,
    totalAmount: 0,
    received: 0,
    toReceive: 0,
  };

  for (const row of rows) {
    if (row.status === "cancelled") continue;

    summary.totalOrders += row.count;
    summary.totalAmount += row.amount;
    summary.received += row.deposit;
    summary.toReceive += Math.max(row.amount - row.deposit, 0);
  }

  return summary;
}

/** Hoje em YYYY-MM-DD (data local). */
export function todayISO(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
