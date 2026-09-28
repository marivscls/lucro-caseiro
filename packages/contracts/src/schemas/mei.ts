import { z } from "zod";

/**
 * Cantinho do MEI. O teto anual vem da lei e pode mudar: mantenha aqui, em um
 * lugar só. Valor vigente em 2026: R$ 81.000 por ano.
 */
export const MEI_ANNUAL_REVENUE_LIMIT = 81_000;
/** A partir de quanto do teto o app avisa (80%). */
export const MEI_WARNING_RATIO = 0.8;
/** O DAS do MEI vence todo dia 20; o app lembra no dia 15. */
export const MEI_DAS_DUE_DAY = 20;
export const MEI_DAS_REMINDER_DAY = 15;

export const MeiActivity = z.enum(["commerce", "industry", "services"]);
export type MeiActivity = z.infer<typeof MeiActivity>;

export const MEI_ACTIVITY_LABELS: Record<MeiActivity, string> = {
  commerce: "Revenda de mercadorias (comércio)",
  industry: "Venda de produtos que eu fabrico (indústria)",
  services: "Prestação de serviços",
};

export const UpdateMeiSettingsDto = z.object({
  activity: MeiActivity.nullable(),
});
export type UpdateMeiSettings = z.infer<typeof UpdateMeiSettingsDto>;

export const MeiStatus = z.enum(["ok", "near", "over"]);
export type MeiStatus = z.infer<typeof MeiStatus>;

export const MeiSummaryDto = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  activity: MeiActivity.nullable(),
  /** Entradas do mês escolhido (base do relatório mensal). */
  monthRevenue: z.number(),
  /** Entradas do ano até o mês atual. */
  yearRevenue: z.number(),
  annualLimit: z.number(),
  usedRatio: z.number(),
  remaining: z.number(),
  /** Projeção do ano no ritmo atual (média dos meses já passados × 12). */
  projectedYearRevenue: z.number(),
  status: MeiStatus,
  months: z.array(z.object({ month: z.number().int(), revenue: z.number() })),
});
export type MeiSummary = z.infer<typeof MeiSummaryDto>;

/** Situação do teto: passou, perto (≥ 80%) ou tranquilo. */
export function meiStatus(
  yearRevenue: number,
  limit = MEI_ANNUAL_REVENUE_LIMIT,
): MeiStatus {
  if (yearRevenue > limit) return "over";
  if (yearRevenue >= limit * MEI_WARNING_RATIO) return "near";
  return "ok";
}
