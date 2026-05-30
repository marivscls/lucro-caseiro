/**
 * Helpers de data dos rótulos. O usuário sempre vê/digita DD/MM/AAAA;
 * o backend armazena ISO (yyyy-mm-dd, exigido por `LabelData`).
 */

/** ISO (yyyy-mm-dd) -> DD/MM/AAAA. Se já não for ISO, devolve o valor como está. */
export function isoToBR(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/** DD/MM/AAAA -> ISO (yyyy-mm-dd). Vazio -> undefined. */
export function brToIso(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed;
}

/** Aplica máscara DD/MM/AAAA progressiva enquanto o usuário digita (só dígitos). */
export function maskDateBR(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length >= 3) out += `/${digits.slice(2, 4)}`;
  if (digits.length >= 5) out += `/${digits.slice(4, 8)}`;
  return out;
}

/** Soma `days` a uma data DD/MM/AAAA completa e devolve DD/MM/AAAA. */
export function addDaysToBR(brDate: string, days: number): string | undefined {
  const iso = brToIso(brDate);
  const match = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  if (!match || !Number.isFinite(days)) return undefined;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setDate(date.getDate() + days);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}
