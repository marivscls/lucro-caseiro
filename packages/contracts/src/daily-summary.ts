/**
 * Resumo da noite: a mensagem do lembrete das 19h com os números do dia.
 * Compartilhado entre o aviso local do celular e o aviso do navegador (API),
 * para os dois dizerem a mesma coisa.
 */
export type DaySalesTally = {
  /** Vendas não canceladas do dia. */
  count: number;
  /** Soma do total dessas vendas, em reais. */
  total: number;
};

export type DaySummaryMessage = { title: string; body: string };

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function eveningSummaryMessage(tally: DaySalesTally): DaySummaryMessage {
  const count = Math.max(0, Math.floor(tally.count));
  if (count === 0) {
    return {
      title: "Como foi o dia? 📝",
      body: "Você ainda não anotou nenhuma venda hoje. Anote agora e veja quanto sobrou no bolso.",
    };
  }
  const total = brl(Math.max(0, tally.total));
  return {
    title: `Hoje você vendeu ${total} 🎉`,
    body:
      count === 1
        ? "Foi 1 venda hoje. Toque para ver quanto sobrou no seu bolso."
        : `Foram ${count} vendas hoje. Toque para ver quanto sobrou no seu bolso.`,
  };
}
