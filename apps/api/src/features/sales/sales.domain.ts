import type { DiscountType, SaleStatus } from "@lucro-caseiro/contracts";

import type { DaySummary, SaleItemData } from "./sales.types";

function discountAmount(
  subtotal: number,
  discountType: DiscountType | null | undefined,
  discountValue: number,
): number {
  if (discountType === "fixed") return discountValue;
  if (discountType === "percentage") return subtotal * (discountValue / 100);
  return 0;
}

export function calculateSaleTotal(items: SaleItemData[]): number {
  return Math.round(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100,
  ) / 100;
}

export function calculateSalePricing(
  items: SaleItemData[],
  discountType?: DiscountType | null,
  discountValue = 0,
): { subtotal: number; discount: number; total: number } {
  const subtotal = calculateSaleTotal(items);
  const discount =
    Math.round(discountAmount(subtotal, discountType, discountValue) * 100) / 100;
  return {
    subtotal,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
  };
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
