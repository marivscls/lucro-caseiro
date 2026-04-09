import type { SaleStatus } from "@lucro-caseiro/contracts";

import type { DaySummary, SaleItemData } from "./sales.types";

export function calculateSaleTotal(items: SaleItemData[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function validateSaleItems(items: SaleItemData[]): string[] {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push("Itens da venda sao obrigatorios");
    return errors;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;

    if (item.quantity <= 0) {
      errors.push(`Item ${i + 1}: quantidade deve ser maior que zero`);
    }

    if (item.unitPrice <= 0) {
      errors.push(`Item ${i + 1}: preco unitario deve ser maior que zero`);
    }
  }

  return errors;
}

export function canCancelSale(status: SaleStatus): boolean {
  return status !== "cancelled";
}

export function buildDaySummary(totalSales: number, totalAmount: number): DaySummary {
  return {
    totalSales,
    totalAmount,
    averageTicket: totalSales > 0 ? totalAmount / totalSales : 0,
  };
}
