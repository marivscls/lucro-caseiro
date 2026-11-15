import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import { PLAN_PRICING } from "@lucro-caseiro/contracts";

/** "R$ 1.234,50" — mesmo formato em Planos e no checkout. */
export function formatMoney(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface PlanPriceDisplay {
  /** Valor por mês, sempre comparável entre planos e períodos. */
  readonly perMonth: string;
  /** O que é cobrado de fato, logo abaixo do valor por mês. */
  readonly charge: string;
}

/**
 * Preço de um plano para comparar: o destaque é sempre o valor por mês (no anual,
 * o equivalente) e a linha de baixo diz quanto é cobrado e quando. Assim os dois
 * planos ficam na mesma unidade e o valor cobrado nunca some.
 */
export function planPriceDisplay(
  plan: PaidPlan,
  period: BillingPeriod,
): PlanPriceDisplay {
  const pricing = PLAN_PRICING[plan];
  if (period === "annual") {
    return {
      perMonth: formatMoney(pricing.annual / 12),
      charge: `${formatMoney(pricing.annual)} cobrados uma vez por ano`,
    };
  }
  return {
    perMonth: formatMoney(pricing.monthly),
    charge: "cobrado todo mês",
  };
}

/** Quanto o anual economiza em relação a 12 mensalidades. */
export function annualSavings(plan: PaidPlan): number {
  const pricing = PLAN_PRICING[plan];
  return pricing.monthly * 12 - pricing.annual;
}
