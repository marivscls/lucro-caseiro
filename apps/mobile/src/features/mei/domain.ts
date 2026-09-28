import {
  MEI_ACTIVITY_LABELS,
  MEI_DAS_DUE_DAY,
  MEI_DAS_REMINDER_DAY,
  type MeiActivity,
  type MeiSummary,
} from "@lucro-caseiro/contracts";

import { formatCurrency } from "../../shared/utils/format";

export const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

export function monthLabel(year: number, month: number): string {
  const name = MONTH_NAMES[month - 1] ?? "";
  return `${name.charAt(0).toLocaleUpperCase("pt-BR")}${name.slice(1)} de ${year}`;
}

/** Mês anterior/seguinte, sem passar do mês atual. */
export function shiftMonth(
  current: { year: number; month: number },
  delta: -1 | 1,
  today: { year: number; month: number },
): { year: number; month: number } | null {
  const index = current.year * 12 + (current.month - 1) + delta;
  if (index > today.year * 12 + (today.month - 1)) return null;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export type MeiReportLine = Readonly<{
  activity: MeiActivity;
  title: string;
  withInvoice: number;
  withoutInvoice: number;
  total: number;
}>;

/**
 * Linhas do Relatório Mensal das Receitas Brutas (modelo do Portal do
 * Empreendedor): comércio, indústria e serviços, cada uma com e sem nota.
 * Todas as entradas do mês vão para a atividade escolhida; `withInvoice` é o
 * quanto a pessoa diz que teve nota fiscal (o resto fica sem nota).
 */
export function meiReportLines(
  activity: MeiActivity,
  monthRevenue: number,
  withInvoice: number,
): MeiReportLine[] {
  const invoiced = Math.min(Math.max(0, withInvoice), monthRevenue);
  return (Object.keys(MEI_ACTIVITY_LABELS) as MeiActivity[]).map((key) => {
    const total = key === activity ? monthRevenue : 0;
    const withNf = key === activity ? invoiced : 0;
    return {
      activity: key,
      title: MEI_ACTIVITY_LABELS[key],
      withInvoice: withNf,
      withoutInvoice: Math.round((total - withNf) * 100) / 100,
      total,
    };
  });
}

/** Relatório em texto, para mandar para a contadora ou guardar no WhatsApp. */
export function meiReportText(
  summary: Pick<MeiSummary, "year" | "month" | "monthRevenue">,
  activity: MeiActivity,
  withInvoice: number,
  businessName: string,
): string {
  const lines = [
    "*Relatório Mensal das Receitas Brutas (MEI)*",
    businessName,
    `Período: ${monthLabel(summary.year, summary.month)}`,
    "",
  ];
  for (const line of meiReportLines(activity, summary.monthRevenue, withInvoice)) {
    lines.push(`*${line.title}*`);
    lines.push(`Com nota fiscal: ${formatCurrency(line.withInvoice)}`);
    lines.push(`Sem nota fiscal: ${formatCurrency(line.withoutInvoice)}`);
    lines.push(`Total: ${formatCurrency(line.total)}`);
    lines.push("");
  }
  lines.push(`*Total geral do mês: ${formatCurrency(summary.monthRevenue)}*`);
  lines.push("Guarde junto das notas de compra e das notas que você emitiu no mês.");
  return lines.join("\n");
}

/** Frase do teto, com o quanto ainda cabe no ano. */
export function ceilingMessage(summary: MeiSummary): string {
  if (summary.status === "over") {
    return `Você passou o teto do MEI em ${formatCurrency(
      summary.yearRevenue - summary.annualLimit,
    )}. Converse com uma contadora para ver o desenquadramento.`;
  }
  if (summary.status === "near") {
    return `Atenção: você já usou ${Math.round(summary.usedRatio * 100)}% do teto. Ainda cabem ${formatCurrency(
      summary.remaining,
    )} até dezembro.`;
  }
  return `Tudo tranquilo. Ainda cabem ${formatCurrency(summary.remaining)} no ano.`;
}

/** A projeção passa do teto? */
export function projectionWarning(summary: MeiSummary): string | null {
  if (summary.status === "over") return null;
  if (summary.projectedYearRevenue <= summary.annualLimit) return null;
  return `No ritmo atual, o ano fecha em ${formatCurrency(
    summary.projectedYearRevenue,
  )}, acima do teto de ${formatCurrency(summary.annualLimit)}.`;
}

/** Próximo vencimento do DAS (dia 20) a partir de hoje. */
export function nextDasDueDate(now: Date): Date {
  const due = new Date(now.getFullYear(), now.getMonth(), MEI_DAS_DUE_DAY);
  if (now.getDate() > MEI_DAS_DUE_DAY) due.setMonth(due.getMonth() + 1);
  return due;
}

export function dasReminderText(now: Date): string {
  const due = nextDasDueDate(now);
  const days = Math.round(
    (due.getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  );
  const when = due.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  if (days === 0) return `O DAS vence hoje (${when}).`;
  if (days === 1) return `O DAS vence amanhã (${when}).`;
  return `O próximo DAS vence em ${days} dias, no dia ${when}. O app avisa no dia ${MEI_DAS_REMINDER_DAY}.`;
}
