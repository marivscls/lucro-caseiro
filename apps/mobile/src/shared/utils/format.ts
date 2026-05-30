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

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? "-" : "";
  const [intPart, decimals] = Math.abs(safe).toFixed(2).split(".");
  return `${sign}R$ ${withThousandsSep(intPart)},${decimals}`;
}
