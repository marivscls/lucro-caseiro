import type {
  AssistantSaleDraft,
  AssistantUsage,
  CreateSale,
  PaymentMethod,
} from "@lucro-caseiro/contracts";

export type DraftItem = AssistantSaleDraft["items"][number];

/** Item pronto para virar venda: produto reconhecido e preço maior que zero. */
export function isReadyItem(
  item: DraftItem,
): item is DraftItem & { productId: string; unitPrice: number } {
  return !!item.productId && item.unitPrice != null && item.unitPrice > 0;
}

export type DraftResult =
  | { ok: true; sale: CreateSale }
  | { ok: false; reason: "empty" | "unknown_items"; names: string[] };

/**
 * Converte o rascunho na venda. Itens que o app não achou nos produtos (ou sem
 * preço) impedem registrar direto: a pessoa ajusta ou abre a Nova venda.
 */
export function draftToSale(
  draft: Pick<AssistantSaleDraft, "items" | "clientId" | "notes">,
  paymentMethod: PaymentMethod,
): DraftResult {
  if (draft.items.length === 0) return { ok: false, reason: "empty", names: [] };
  const unknown = draft.items.filter((item) => !isReadyItem(item));
  if (unknown.length > 0) {
    return {
      ok: false,
      reason: "unknown_items",
      names: unknown.map((item) => item.name),
    };
  }
  const sale: CreateSale = {
    paymentMethod,
    items: draft.items.filter(isReadyItem).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
  if (draft.clientId) sale.clientId = draft.clientId;
  if (draft.notes) sale.notes = draft.notes.slice(0, 500);
  return { ok: true, sale };
}

export function draftTotal(items: DraftItem[]): number {
  const total = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity,
    0,
  );
  return Math.round(total * 100) / 100;
}

/** "3 de 15 usos este mês" ou "Uso liberado". */
export function usageLabel(usage: AssistantUsage | undefined): string {
  if (!usage) return "";
  if (usage.limit == null) return "Uso liberado no seu plano";
  const left = Math.max(0, usage.limit - usage.used);
  if (usage.trial) {
    return left === 1 ? "Resta 1 uso de teste" : `Restam ${left} usos de teste`;
  }
  return left === 1 ? "Resta 1 uso este mês" : `Restam ${left} usos este mês`;
}

export function usageExhausted(usage: AssistantUsage | undefined): boolean {
  return !!usage && usage.limit != null && usage.used >= usage.limit;
}

export const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "cash", label: "Dinheiro" },
  { value: "card", label: "Cartão" },
  { value: "credit", label: "Fiado" },
];
