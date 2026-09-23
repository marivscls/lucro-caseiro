export function maskCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";

  const fixed = (Number(digits) / 100).toFixed(2);
  const [intPart, decimalPart] = fixed.split(".");
  return `${withThousandsSep(intPart)},${decimalPart}`;
}

export function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(normalized);
}

/** Campo vazio vira `NaN`; `NaN <= 0` é falso e deixava avançar etapas. */
export function isPositiveCurrency(value: string): boolean {
  const parsed = parseCurrencyInput(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export function currencyInput(value: number): string {
  return maskCurrencyInput(String(Math.round(value * 100)));
}

function withThousandsSep(intPart: string): string {
  let out = "";
  for (let index = 0; index < intPart.length; index += 1) {
    if (index > 0 && (intPart.length - index) % 3 === 0) out += ".";
    out += intPart[index];
  }
  return out;
}
