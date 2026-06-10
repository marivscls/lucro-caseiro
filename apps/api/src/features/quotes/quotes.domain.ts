import type { QuoteItem } from "@lucro-caseiro/contracts";

/** Total do orçamento = soma de quantidade x preço unitário, em centavos exatos. */
export function computeQuoteTotal(items: QuoteItem[]): number {
  const cents = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100),
    0,
  );
  return cents / 100;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateQuote(data: {
  title?: string;
  items?: QuoteItem[];
  validUntil?: string | null;
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
