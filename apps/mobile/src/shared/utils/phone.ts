/** Utilidades de telefone BR (máscara e validação), independentes do WhatsApp. */

/** Aplica máscara (XX) XXXXX-XXXX progressivamente enquanto digita. */
export function maskPhoneBR(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;

  // 11 dígitos (celular) -> 5+4; 10 dígitos (fixo) -> 4+4.
  const splitAt = digits.length >= 11 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
}

/**
 * Telefone BR válido para contato: nacional (10 fixo / 11 celular) ou já com
 * DDI 55 (12 fixo / 13 celular).
 */
export function isValidBrazilPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return true;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return true;
  }
  return false;
}
