/**
 * Helpers de data compartilhados (fonte única para toda a UI).
 * O usuário sempre vê/digita DD/MM/AAAA; o backend armazena ISO (yyyy-mm-dd).
 */

/** ISO (yyyy-mm-dd) -> DD/MM/AAAA. Se já não for ISO, devolve o valor como está. */
export function isoToBR(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * DD/MM/AAAA -> ISO (yyyy-mm-dd). Retorna undefined se vazio OU se a data for
 * incompleta/inválida (ano sem 4 dígitos, mês/dia fora de faixa, 31/02 etc.) —
 * assim nunca enviamos uma data inválida que o backend rejeitaria.
 */
export function brToIso(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parts = trimmed.split("/");
  if (parts.length !== 3) return undefined;
  const [d, mo, y] = parts;
  if (y.length !== 4) return undefined;

  const day = Number(d);
  const month = Number(mo);
  const year = Number(y);
  if (![day, month, year].every(Number.isInteger)) return undefined;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;

  const iso = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dt = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dt.getTime()) || dt.getDate() !== day || dt.getMonth() + 1 !== month) {
    return undefined;
  }
  return iso;
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
