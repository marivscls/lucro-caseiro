import type { ProlaboreProgress } from "@lucro-caseiro/contracts";

import { formatCurrency } from "../../shared/utils/format";

export { formatCurrency };

/**
 * Mensagem amigavel de incentivo a partir do progresso da meta.
 * Linguagem simples (publico não-tech), conforme principios de UX do projeto.
 */
export function prolaboreMessage(progress: ProlaboreProgress): string {
  if (progress.reached) {
    return "Você já atingiu sua meta deste mês! 🎉";
  }
  if (progress.salesRemaining !== null && progress.salesRemaining > 0) {
    const plural = progress.salesRemaining === 1 ? "venda" : "vendas";
    return `Faltam ~${progress.salesRemaining} ${plural} para sua meta`;
  }
  return `Faltam ${formatCurrency(progress.remainingRevenue)} para sua meta`;
}
