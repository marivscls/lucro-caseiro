import type { Quote } from "@lucro-caseiro/contracts";
import { formatCurrency } from "../../shared/utils/format";

function money(value: number): string {
  return formatCurrency(value);
}

function qty(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

/**
 * Texto do orçamento para enviar no WhatsApp. Com `pixCode`, termina com o
 * Pix copia e cola do total para fechar na hora.
 */
export function buildQuoteMessage(
  quote: Quote,
  businessName: string,
  pixCode?: string | null,
): string {
  const lines = [
    `*Orçamento: ${quote.title}*`,
    businessName,
    "",
    ...quote.items.map(
      (item) =>
        `• ${qty(item.quantity)}x ${item.description}: ${money(
          item.quantity * item.unitPrice,
        )}`,
    ),
    "",
  ];
  if (quote.discount > 0) {
    lines.push(`Subtotal: ${money(quote.subtotal)}`);
    lines.push(`Desconto: -${money(quote.discount)}`);
  }
  lines.push(`*Total: ${money(quote.total)}*`);
  if (quote.validUntil) {
    const [y, m, d] = quote.validUntil.split("-");
    lines.push(`Válido até ${d}/${m}/${y}`);
  }
  if (quote.notes) {
    lines.push("", quote.notes);
  }
  if (pixCode) {
    lines.push(
      "",
      `Para confirmar, é só pagar ${money(quote.total)} no *Pix copia e cola* (o valor já vem preenchido):`,
      pixCode,
    );
  }
  lines.push("", "Qualquer dúvida é só chamar! 😊");
  return lines.join("\n");
}
