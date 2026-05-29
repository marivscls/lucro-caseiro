/** Domínio puro dos insights: normalização da janela e geração de buckets mensais. */

export const DEFAULT_MONTHS = 6;
export const MAX_MONTHS = 12;

/** Garante uma janela válida entre 1 e MAX_MONTHS (default 6). */
export function clampMonths(input: number | undefined): number {
  if (input == null || Number.isNaN(input)) return DEFAULT_MONTHS;
  return Math.min(MAX_MONTHS, Math.max(1, Math.trunc(input)));
}

/** Primeiro dia (UTC) do mês inicial da janela de `months` meses até o mês de `now`. */
export function startOfRange(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
}

/** Lista das chaves de mês "YYYY-MM" da janela, do mais antigo ao mais recente. */
export function monthKeys(now: Date, months: number): string[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    keys.push(`${d.getUTCFullYear()}-${m}`);
  }
  return keys;
}
