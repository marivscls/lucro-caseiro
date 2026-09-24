/**
 * Textos de exibição dos lançamentos (puros). Usados pelo painel no celular e
 * no desktop, para as duas versões falarem igual.
 */

type DisplayEntry = Readonly<{ description: string; date: string }>;

/** Contagem humana, sem "0 lançamentos". */
export function entryCountLabel(count: number): string {
  if (count === 0) return "Nenhum lançamento";
  if (count === 1) return "1 lançamento";
  return `${count} lançamentos`;
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}

export function categoryLabel(
  category: string,
  materialNoun = "material",
  packagingNoun = "embalagem",
): string {
  const labels: Record<string, string> = {
    material: capitalize(materialNoun),
    packaging: capitalize(packagingNoun),
    transport: "Transporte",
    fee: "Taxa",
    utility: "Utilidade",
    other: "Outro",
    sale: "Venda",
  };
  return labels[category] ?? category;
}

/** Descrição sem prefixos técnicos ("Compra:", "[tag]"). */
export function entryDisplayDescription(entry: DisplayEntry, isIncome: boolean): string {
  const cleaned = entry.description
    .replace(/^Compra:\s*/i, "")
    .replace(/^\[[^\]]+\]\s*/, "")
    .trim();
  return cleaned || (isIncome ? "Entrada" : "Saída");
}

/** "dd/mm" do lançamento; devolve o texto original se a data for inválida. */
export function formatEntryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}
