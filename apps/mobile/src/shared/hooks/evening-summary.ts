import {
  eveningSummaryMessage,
  type DaySalesTally,
  type DaySummaryMessage,
} from "@lucro-caseiro/contracts";

export const EVENING_HOUR = 19;
/** Quantos dias à frente ficam agendados (cobre quem não abre o app). */
export const EVENING_DAYS_AHEAD = 3;
export const EVENING_ID_PREFIX = "evening-summary-";

export type EveningSlot = { id: string; at: Date; message: DaySummaryMessage };

/**
 * Resumos da noite a agendar a partir de `now`. Hoje (se ainda não passou das
 * 19h) leva as vendas do dia; os dias seguintes começam sem vendas e são
 * reagendados com os números reais quando o app abre. Função pura.
 */
export function eveningSchedule(now: Date, today: DaySalesTally): EveningSlot[] {
  const slots: EveningSlot[] = [];
  for (let offset = 0; offset <= EVENING_DAYS_AHEAD; offset++) {
    const at = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      EVENING_HOUR,
      0,
      0,
    );
    if (at.getTime() <= now.getTime()) continue;
    slots.push({
      id: `${EVENING_ID_PREFIX}${offset}`,
      at,
      message: eveningSummaryMessage(offset === 0 ? today : { count: 0, total: 0 }),
    });
  }
  return slots;
}
