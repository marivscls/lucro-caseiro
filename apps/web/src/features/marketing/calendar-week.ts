import type { MarketingResource } from "@/shared/types";

export const editorialWeekDays = [
  { number: 1, short: "SEG", label: "Segunda" },
  { number: 2, short: "TER", label: "Terça" },
  { number: 3, short: "QUA", label: "Quarta" },
  { number: 4, short: "QUI", label: "Quinta" },
  { number: 5, short: "SEX", label: "Sexta" },
  { number: 6, short: "SÁB", label: "Sábado" },
  { number: 7, short: "DOM", label: "Domingo" },
] as const;

export function itemsForEditorialDay(
  items: MarketingResource[],
  week: number,
  weekday: number,
): MarketingResource[] {
  return items
    .filter(
      (item) =>
        Number(item.data.week ?? 1) === week &&
        Number(item.data.weekday ?? 0) === weekday,
    )
    .sort((left, right) => left.title.localeCompare(right.title, "pt-BR"));
}

export function pedalIntentClass(value: unknown): string {
  const normalized =
    typeof value === "string"
      ? value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      : "";
  const aliases: Record<string, string> = {
    promocao: "promotion",
    promotion: "promotion",
    entretenimento: "entertainment",
    entertainment: "entertainment",
    debate: "debate",
    aprendizado: "learning",
    learning: "learning",
    ligacao: "connection",
    connection: "connection",
  };
  return aliases[normalized] ?? "unassigned";
}
