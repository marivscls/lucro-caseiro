import type { SaleStatus } from "@lucro-caseiro/contracts";

import type { DaySummary, SaleItemData } from "./sales.types";

export function calculateSaleTotal(items: SaleItemData[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function validateSaleItems(items: SaleItemData[]): string[] {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push("Itens da venda são obrigatorios");
    return errors;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;

    if (item.quantity <= 0) {
      errors.push(`Item ${i + 1}: quantidade deve ser maior que zero`);
    }

    if (item.unitPrice <= 0) {
      errors.push(`Item ${i + 1}: preço unitario deve ser maior que zero`);
    }
  }

  return errors;
}

export function canCancelSale(status: SaleStatus): boolean {
  return status !== "cancelled";
}

/**
 * Status inicial da venda a partir da forma de pagamento. "credit" (fiado / pagar
 * depois) nasce PENDENTE — é uma dívida em aberto que aparece na tela Fiado; as demais
 * formas (pix, dinheiro, cartão, transferência) já entram como pagas.
 */
export function initialSaleStatus(paymentMethod: string): SaleStatus {
  return paymentMethod === "credit" ? "pending" : "paid";
}

export function buildDaySummary(totalSales: number, totalAmount: number): DaySummary {
  return {
    totalSales,
    totalAmount,
    averageTicket: totalSales > 0 ? totalAmount / totalSales : 0,
  };
}
