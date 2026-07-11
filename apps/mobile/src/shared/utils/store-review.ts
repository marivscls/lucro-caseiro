import { asyncStorage } from "./async-storage";

const ASKED_FLAG_KEY = "store-review-asked";
const MIN_SALES_TO_ASK = 3;

/**
 * Pede avaliacao na loja apos a 3a venda registrada (momento de sucesso), uma
 * unica vez por instalacao. Nunca lanca erro — falha silenciosa pra nao
 * quebrar o fluxo de venda.
 */
export async function maybeAskForReview(totalSales: number): Promise<void> {
  try {
    if (totalSales < MIN_SALES_TO_ASK) return;

    const alreadyAsked = await asyncStorage.getItem(ASKED_FLAG_KEY);
    if (alreadyAsked) return;

    const StoreReview = await import("expo-store-review");
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await asyncStorage.setItem(ASKED_FLAG_KEY, "1");
    await StoreReview.requestReview();
  } catch {
    // silencia qualquer erro (API indisponivel, sem storage, etc.) — nunca
    // deve interromper o fluxo de venda.
  }
}
