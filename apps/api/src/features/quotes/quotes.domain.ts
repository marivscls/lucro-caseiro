import type { DiscountType, QuoteItem } from "@lucro-caseiro/contracts";

function discountAmount(
  subtotal: number,
  discountType: DiscountType | null | undefined,
  discountValue: number,
): number {
  if (discountType === "fixed") return discountValue;
  if (discountType === "percentage") return subtotal * (discountValue / 100);
  return 0;
}

/** Total do orçamento = soma de quantidade x preço unitário, em centavos exatos. */
export function computeQuoteTotal(items: QuoteItem[]): number {
  const cents = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100),
    0,
  );
  return cents / 100;
}

export function computeQuotePricing(
  items: QuoteItem[],
  discountType?: DiscountType | null,
  discountValue = 0,
): {
  subtotal: number;
  discount: number;
  total: number;
  estimatedCost: number;
  estimatedGain: number;
  estimatedMargin: number;
} {
  const subtotal = computeQuoteTotal(items);
  const discount =
    Math.round(discountAmount(subtotal, discountType, discountValue) * 100) / 100;
  const total = Math.round((subtotal - discount) * 100) / 100;
  const estimatedCost =
    Math.round(
      items.reduce(
        (sum, item) => sum + item.quantity * (item.estimatedUnitCost ?? 0),
        0,
      ) * 100,
    ) / 100;
  const estimatedGain = Math.round((total - estimatedCost) * 100) / 100;
  const estimatedMargin =
    total > 0 ? Math.round((estimatedGain / total) * 10_000) / 100 : 0;
  return {
    subtotal,
    discount,
    total,
    estimatedCost,
    estimatedGain,
    estimatedMargin,
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateQuote(data: {
  title?: string;
  items?: QuoteItem[];
  validUntil?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number;
}): string[] {
  const errors: string[] = [];

  if (data.title !== undefined && data.title.trim().length === 0) {
    errors.push("O título é obrigatório");
  }
  if (data.items !== undefined) {
    if (data.items.length === 0) {
      errors.push("Adicione pelo menos um item");
    }
    for (const item of data.items) {
      if (!item.description.trim()) {
        errors.push("Todo item precisa de uma descrição");
        break;
      }
    }
  }
  if (data.validUntil != null && !DATE_RE.test(data.validUntil)) {
    errors.push("Data de validade inválida");
  }
  if (data.discountType === "percentage" && (data.discountValue ?? 0) > 100) {
    errors.push("O desconto percentual deve ser de no máximo 100%");
  }

  return errors;
}

/** Resumo dos itens para a descrição da encomenda gerada na conversão. */
export function quoteItemsSummary(items: QuoteItem[]): string {
  return items
    .map((item) => `${formatQty(item.quantity)}x ${item.description}`)
    .join(", ");
}

function formatQty(quantity: number): string {
  return Number.isInteger(quantity)
    ? String(quantity)
    : String(quantity).replace(".", ",");
}
