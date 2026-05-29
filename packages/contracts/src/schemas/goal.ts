import { z } from "zod";

export const UpsertProlaboreGoalDto = z.object({
  monthlyProlaboreGoal: z.number().positive(),
  estimatedMonthlyCosts: z.number().min(0).optional(),
  avgTicketOverride: z.number().positive().optional(),
});

export type UpsertProlaboreGoal = z.infer<typeof UpsertProlaboreGoalDto>;

export const ProlaboreGoalDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  monthlyProlaboreGoal: z.number(),
  estimatedMonthlyCosts: z.number().nullable(),
  avgTicketOverride: z.number().nullable(),
  updatedAt: z.string().datetime(),
});

export type ProlaboreGoal = z.infer<typeof ProlaboreGoalDto>;

export const ProlaboreProgressDto = z.object({
  /** Faturamento necessario no mes = meta + custos/despesas. */
  requiredRevenue: z.number(),
  /** Faturamento atual do mes (totalIncome). */
  currentRevenue: z.number(),
  /** Quanto ainda falta faturar (>= 0). */
  remainingRevenue: z.number(),
  /** Progresso 0-100. */
  progressPct: z.number(),
  /** Vendas estimadas para a meta toda (null se nao ha ticket medio). */
  salesNeeded: z.number().nullable(),
  /** Vendas estimadas que ainda faltam (null se nao ha ticket medio). */
  salesRemaining: z.number().nullable(),
  /** Ticket medio usado no calculo (null se indeterminado). */
  avgTicket: z.number().nullable(),
  /** True quando a meta ja foi atingida. */
  reached: z.boolean(),
  /** Periodo no formato YYYY-MM. */
  period: z.string(),
});

export type ProlaboreProgress = z.infer<typeof ProlaboreProgressDto>;

export const ProlaboreStatusDto = z.object({
  config: ProlaboreGoalDto.nullable(),
  progress: ProlaboreProgressDto,
});

export type ProlaboreStatus = z.infer<typeof ProlaboreStatusDto>;
