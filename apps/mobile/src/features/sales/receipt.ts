import type { Sale } from "@lucro-caseiro/contracts";

import { formatCurrency } from "../../shared/utils/format";
import { paymentLabel } from "./payment";

function dateBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Monta o texto do recibo de uma venda para enviar no WhatsApp. */
export function buildReceiptMessage(sale: Sale): string {
  const lines: string[] = [];
  lines.push("🧾 *Recibo de compra*");
  lines.push(dateBR(sale.soldAt));
  if (sale.clientName) lines.push(`Cliente: ${sale.clientName}`);
  lines.push("");

  for (const item of sale.items) {
    lines.push(
      `• ${item.quantity}x ${item.productName} — ${formatCurrency(item.subtotal)}`,
    );
  }

  lines.push("");
  lines.push(`*Total: ${formatCurrency(sale.total)}*`);
  lines.push(`Pagamento: ${paymentLabel(sale.paymentMethod)}`);
  if (sale.status === "pending") lines.push("Situação: em aberto");
  lines.push("");
  lines.push("Obrigada pela preferência! 💛");

  return lines.join("\n");
}
