import type { Product, RetailDocument, RetailPromotion } from "@lucro-caseiro/contracts";

export const INITIAL_RETAIL_STATUS: Record<
  RetailDocument["kind"],
  RetailDocument["status"]
> = {
  cash_session: "open",
  school_list: "active",
  inventory_count: "counting",
  purchase_order: "draft",
  service_order: "quoted",
  catalog_order: "new",
  fiscal_document: "waiting_configuration",
};

const TRANSITIONS: Partial<
  Record<
    RetailDocument["kind"],
    Partial<Record<RetailDocument["status"], RetailDocument["status"][]>>
  >
> = {
  cash_session: { open: ["closed"] },
  inventory_count: { counting: ["finalized", "cancelled"] },
  purchase_order: {
    draft: ["sent", "cancelled"],
    sent: ["partial", "received", "cancelled"],
    partial: ["received", "cancelled"],
  },
  service_order: {
    quoted: ["waiting_file", "production", "cancelled"],
    waiting_file: ["production", "cancelled"],
    production: ["ready", "cancelled"],
    ready: ["delivered", "cancelled"],
  },
  catalog_order: {
    new: ["confirmed", "expired", "cancelled"],
    confirmed: ["separated", "cancelled"],
    separated: ["ready", "cancelled"],
    ready: ["completed", "cancelled"],
  },
  fiscal_document: {
    waiting_configuration: ["processing", "cancelled"],
    processing: ["authorized", "rejected", "contingency"],
    authorized: ["cancelled"],
    rejected: ["processing", "cancelled"],
    contingency: ["processing", "cancelled"],
  },
};

export function canTransitionRetailDocument(
  document: RetailDocument,
  next: RetailDocument["status"],
): boolean {
  if (document.status === next) return true;
  return TRANSITIONS[document.kind]?.[document.status]?.includes(next) ?? false;
}

export interface QuotedRetailLine {
  product: Product;
  variationId?: string;
  variationName?: string;
  quantity: number;
  originalUnitPrice: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
}

function promotionTotal(
  unitPrice: number,
  quantity: number,
  promotion: RetailPromotion,
): number {
  const gross = unitPrice * quantity;
  if (promotion.type === "percentage") {
    return gross * (1 - promotion.value / 100);
  }
  if (promotion.type === "fixed") {
    return Math.max(0, gross - promotion.value * quantity);
  }
  const buy = promotion.buyQuantity ?? 0;
  const pay = promotion.payQuantity ?? 0;
  if (buy <= pay || pay <= 0) return gross;
  const groups = Math.floor(quantity / buy);
  return (groups * pay + (quantity % buy)) * unitPrice;
}

export function quoteRetailLine(
  product: Product,
  quantity: number,
  variationId: string | undefined,
  promotions: RetailPromotion[],
): QuotedRetailLine {
  const applicable = promotions.filter(
    (promotion) =>
      promotion.active &&
      (promotion.productId === product.id || promotion.category === product.category),
  );
  const gross = product.salePrice * quantity;
  let bestTotal = gross;
  for (const promotion of applicable) {
    bestTotal = Math.min(
      bestTotal,
      promotionTotal(product.salePrice, quantity, promotion),
    );
  }
  const subtotal = Math.round(bestTotal * 100) / 100;
  const variation = variationId
    ? product.variations?.find((candidate) => candidate.id === variationId)
    : undefined;
  return {
    product,
    ...(variationId ? { variationId } : {}),
    ...(variation ? { variationName: variation.name } : {}),
    quantity,
    originalUnitPrice: product.salePrice,
    unitPrice: Math.round((subtotal / quantity) * 100) / 100,
    subtotal,
    discount: Math.round((gross - subtotal) * 100) / 100,
  };
}

export function distributeManualDiscount(
  lines: QuotedRetailLine[],
  discount: number,
): QuotedRetailLine[] {
  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
  if (discount <= 0) return lines;
  if (discount >= total) throw new Error("O desconto deve ser menor que o total");
  let remainingCents = Math.round(discount * 100);
  return lines.map((line, index) => {
    const lineCents = Math.round(line.subtotal * 100);
    const allocated =
      index === lines.length - 1
        ? remainingCents
        : Math.min(
            lineCents - 1,
            Math.round(
              (lineCents / Math.round(total * 100)) * Math.round(discount * 100),
            ),
          );
    remainingCents -= allocated;
    const subtotal = (lineCents - allocated) / 100;
    return {
      ...line,
      subtotal,
      unitPrice: Math.round((subtotal / line.quantity) * 100) / 100,
      discount: Math.round((line.discount + allocated / 100) * 100) / 100,
    };
  });
}

export function escapeRetailHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });
}
