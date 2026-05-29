import type { ProlaboreProgress } from "@lucro-caseiro/contracts";

export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Mensagem amigavel de incentivo a partir do progresso da meta.
 * Linguagem simples (publico nao-tech), conforme principios de UX do projeto.
 */
export function prolaboreMessage(progress: ProlaboreProgress): string {
  if (progress.reached) {
    return "Voce ja atingiu sua meta deste mes! 🎉";
  }
  if (progress.salesRemaining !== null && progress.salesRemaining > 0) {
    const plural = progress.salesRemaining === 1 ? "venda" : "vendas";
    return `Faltam ~${progress.salesRemaining} ${plural} para sua meta`;
  }
  return `Faltam ${formatCurrency(progress.remainingRevenue)} para sua meta`;
}
