/** Formatação de exibição compartilhada (fonte única para toda a UI). */

/**
 * Moeda BR: `R$ 1.234,56` (vírgula decimal, ponto de milhar).
 * Implementação manual (sem `Intl`) para comportamento idêntico em qualquer
 * engine do React Native.
 */
function withThousandsSep(intPart: string): string {
  let out = "";
  for (let i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 === 0) out += ".";
    out += intPart[i];
  }
  return out;
}

/** Inteiro com ponto de milhar (sem centavos): 1234.6 -> "1.235". */
export function formatIntBR(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const sign = rounded < 0 ? "-" : "";
  return sign + withThousandsSep(String(Math.abs(rounded)));
}

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? "-" : "";
  const [intPart, decimals] = Math.abs(safe).toFixed(2).split(".");
  return `${sign}R$ ${withThousandsSep(intPart)},${decimals}`;
}
