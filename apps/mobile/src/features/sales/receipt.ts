import type { Sale } from "@lucro-caseiro/contracts";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card: "Cartão",
  credit: "Fiado",
  transfer: "Transferência",
};

function money(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

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
    lines.push(`• ${item.quantity}x ${item.productName} — ${money(item.subtotal)}`);
  }

  lines.push("");
  lines.push(`*Total: ${money(sale.total)}*`);
  lines.push(`Pagamento: ${PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}`);
  if (sale.status === "pending") lines.push("Situação: em aberto");
  lines.push("");
  lines.push("Obrigada pela preferência! 💛");

  return lines.join("\n");
}
