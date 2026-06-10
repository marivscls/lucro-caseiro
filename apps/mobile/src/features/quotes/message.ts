import type { Quote } from "@lucro-caseiro/contracts";

function money(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function qty(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

/** Texto do orçamento para enviar no WhatsApp. */
export function buildQuoteMessage(quote: Quote, businessName: string): string {
  const lines = [
    `*Orçamento — ${quote.title}*`,
    businessName,
    "",
    ...quote.items.map(
      (item) =>
        `• ${qty(item.quantity)}x ${item.description} — ${money(
          item.quantity * item.unitPrice,
        )}`,
    ),
    "",
    `*Total: ${money(quote.total)}*`,
  ];
  if (quote.validUntil) {
    const [y, m, d] = quote.validUntil.split("-");
    lines.push(`Válido até ${d}/${m}/${y}`);
  }
  if (quote.notes) {
    lines.push("", quote.notes);
  }
  lines.push("", "Qualquer dúvida é só chamar! 😊");
  return lines.join("\n");
}
