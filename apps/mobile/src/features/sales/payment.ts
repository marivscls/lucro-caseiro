import type { PaymentMethod } from "@lucro-caseiro/contracts";

/** Rótulos pt-BR das formas de pagamento — fonte única usada em toda a UI. */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card: "Cartão",
  credit: "Fiado",
  transfer: "Transferência",
};

/** Rótulo seguro a partir de um método (com fallback para o valor cru). */
export function paymentLabel(method: string): string {
  return PAYMENT_LABELS[method as PaymentMethod] ?? method;
}

/** Opções (valor + rótulo) na ordem padrão — para seletores simples. */
export const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = (
  Object.keys(PAYMENT_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_LABELS[value] }));
