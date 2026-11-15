// ---------------------------------------------------------------------------
// Datas que vendem: próxima data comercial dentro da janela de aviso
// ---------------------------------------------------------------------------

export type SeasonalDateId =
  | "pascoa"
  | "maes"
  | "namorados"
  | "pais"
  | "cliente"
  | "criancas"
  | "black-friday"
  | "natal";

export type SeasonalDate = {
  id: SeasonalDateId;
  /** "Natal", "Black Friday" — usado em "Hoje é Natal!". */
  name: string;
  /** "o Natal", "a Black Friday" — usado em "Faltam 12 dias para a Black Friday". */
  withArticle: string;
  /** Dias antes da data em que o aviso começa a aparecer. */
  leadDays: number;
  tip: string;
};

export type UpcomingSeasonalDate = SeasonalDate & {
  /** Data local (meio-dia) do dia comercial. */
  date: Date;
  /** "natal-2026": chave estável para dispensar só aquela data. */
  key: string;
  /** 0 no próprio dia. */
  daysLeft: number;
};

/** Janela padrão de aviso: 30 dias antes até o próprio dia. */
export const SEASONAL_LEAD_DAYS = 30;
/** Natal aparece antes: encomendas de fim de ano começam cedo. */
export const CHRISTMAS_LEAD_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;

const DATES: Record<SeasonalDateId, Omit<SeasonalDate, "id">> = {
  pascoa: {
    name: "Páscoa",
    withArticle: "a Páscoa",
    leadDays: SEASONAL_LEAD_DAYS,
    tip: "Muita gente encomenda presentes com antecedência. Abra os pedidos agora e combine a data de entrega.",
  },
  maes: {
    name: "Dia das Mães",
    withArticle: "o Dia das Mães",
    leadDays: SEASONAL_LEAD_DAYS,
    tip: "Presente pronto vende rápido. Ofereça kits e anote as encomendas com antecedência.",
  },
  namorados: {
    name: "Dia dos Namorados",
    withArticle: "o Dia dos Namorados",
    leadDays: SEASONAL_LEAD_DAYS,
    tip: "Um kit especial para casal vende bem. Mostre a novidade no catálogo e anote os pedidos.",
  },
  pais: {
    name: "Dia dos Pais",
    withArticle: "o Dia dos Pais",
    leadDays: SEASONAL_LEAD_DAYS,
    tip: "Muita gente deixa o presente para a última semana. Lembre suas clientes antes disso.",
  },
  cliente: {
    name: "Dia do Cliente",
    withArticle: "o Dia do Cliente",
    leadDays: SEASONAL_LEAD_DAYS,
    tip: "Um mimo ou um desconto pequeno agradece quem sempre compra. Avise pelo WhatsApp.",
  },
  criancas: {
    name: "Dia das Crianças",
    withArticle: "o Dia das Crianças",
    leadDays: SEASONAL_LEAD_DAYS,
    tip: "Lembrancinhas e presentes saem bem. Mostre suas opções no catálogo.",
  },
  "black-friday": {
    name: "Black Friday",
    withArticle: "a Black Friday",
    leadDays: SEASONAL_LEAD_DAYS,
    tip: "Um combo especial chama atenção sem baixar demais o preço. Mande o catálogo para suas clientes.",
  },
  natal: {
    name: "Natal",
    withArticle: "o Natal",
    leadDays: CHRISTMAS_LEAD_DAYS,
    tip: "Quem abre encomendas cedo vende mais. Avise suas clientes e anote os pedidos.",
  },
};

function localNoon(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 12);
}

/** Domingo de Páscoa (calendário gregoriano, algoritmo de Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return localNoon(year, month - 1, day);
}

/** N-ésimo dia da semana do mês (weekday: 0 = domingo … 6 = sábado). */
export function nthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number,
  n: number,
): Date {
  const first = localNoon(year, monthIndex, 1).getDay();
  const offset = (weekday - first + 7) % 7;
  return localNoon(year, monthIndex, 1 + offset + (n - 1) * 7);
}

/** Sexta-feira depois da 4ª quinta-feira de novembro. */
export function blackFriday(year: number): Date {
  const thanksgiving = nthWeekdayOfMonth(year, 10, 4, 4);
  return localNoon(year, 10, thanksgiving.getDate() + 1);
}

/** Datas comerciais de um ano, em ordem do calendário. */
export function seasonalDatesOf(year: number): { id: SeasonalDateId; date: Date }[] {
  const list: { id: SeasonalDateId; date: Date }[] = [
    { id: "pascoa", date: easterSunday(year) },
    { id: "maes", date: nthWeekdayOfMonth(year, 4, 0, 2) },
    { id: "namorados", date: localNoon(year, 5, 12) },
    { id: "pais", date: nthWeekdayOfMonth(year, 7, 0, 2) },
    { id: "cliente", date: localNoon(year, 8, 15) },
    { id: "criancas", date: localNoon(year, 9, 12) },
    { id: "black-friday", date: blackFriday(year) },
    { id: "natal", date: localNoon(year, 11, 25) },
  ];
  return list.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function calendarDaysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

/**
 * Datas comerciais dentro da janela de aviso de hoje (de `leadDays` antes até o
 * próprio dia), da mais próxima para a mais distante.
 */
export function seasonalDatesInWindow(now: Date): UpcomingSeasonalDate[] {
  const year = now.getFullYear();
  return [...seasonalDatesOf(year), ...seasonalDatesOf(year + 1)]
    .map(({ id, date }) => ({
      id,
      ...DATES[id],
      date,
      key: `${id}-${date.getFullYear()}`,
      daysLeft: calendarDaysBetween(now, date),
    }))
    .filter((item) => item.daysLeft >= 0 && item.daysLeft <= item.leadDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/** A data mais próxima ainda não dispensada; null se nenhuma está na janela. */
export function nextSeasonalDate(
  now: Date,
  dismissed: readonly string[] = [],
): UpcomingSeasonalDate | null {
  return seasonalDatesInWindow(now).find((item) => !dismissed.includes(item.key)) ?? null;
}

/** "Hoje é Natal!", "Falta 1 dia para o Natal", "Faltam 12 dias para a Black Friday". */
export function seasonalTitle(
  item: Pick<UpcomingSeasonalDate, "daysLeft" | "name" | "withArticle">,
): string {
  if (item.daysLeft === 0) return `Hoje é ${item.name}!`;
  if (item.daysLeft === 1) return `Falta 1 dia para ${item.withArticle}`;
  return `Faltam ${item.daysLeft} dias para ${item.withArticle}`;
}

/**
 * Lê a lista salva de datas dispensadas. Valor inválido vira lista vazia e
 * chaves de anos antigos são descartadas para a lista não crescer.
 */
export function parseDismissedSeasonalKeys(raw: string | null, now: Date): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const minYear = now.getFullYear() - 1;
    return parsed.filter(
      (key): key is string => typeof key === "string" && Number(key.slice(-4)) >= minYear,
    );
  } catch {
    return [];
  }
}
