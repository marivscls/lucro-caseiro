// Contas puras de preço do Premium, usadas pelos cartões de planos (cliente) e
// pelo FAQ (servidor). Ficam fora de `pricing-plans.tsx` porque um módulo
// "use client" não pode ter funções chamadas a partir de um componente de servidor.

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "R$ 37,42" (com espaço fixo depois do R$, como o Intl formata). */
export function formatBrl(value: number): string {
  return money.format(value);
}

/** Valor por mês do plano anual (o que a pessoa compara), em centavos redondos. */
export function annualMonthlyEquivalent(annual: number): number {
  return Math.round((annual / 12) * 100) / 100;
}

/** Quanto o anual economiza em relação a 12 mensalidades. */
export function annualSavings(monthly: number, annual: number): number {
  return Math.round((monthly * 12 - annual) * 100) / 100;
}
