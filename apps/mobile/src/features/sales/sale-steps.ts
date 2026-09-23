/** Etapas da venda: 1 cliente, 2 produtos, 3 pagamento, 4 revisão. */
export type SaleStep = 1 | 2 | 3 | 4;

/**
 * A venda começa pelos produtos (onde fica a venda rápida). O cliente vem
 * depois e é opcional ("Venda avulsa").
 */
export const SALE_STEP_ORDER: readonly SaleStep[] = [2, 1, 3, 4];
export const FIRST_SALE_STEP: SaleStep = SALE_STEP_ORDER[0];

export function nextSaleStep(step: SaleStep): SaleStep {
  const index = SALE_STEP_ORDER.indexOf(step);
  return SALE_STEP_ORDER[Math.min(index + 1, SALE_STEP_ORDER.length - 1)];
}

export function previousSaleStep(step: SaleStep): SaleStep | null {
  const index = SALE_STEP_ORDER.indexOf(step);
  return index > 0 ? SALE_STEP_ORDER[index - 1] : null;
}

/** Posição (1 a 4) da etapa na barra de progresso. */
export function saleStepPosition(step: SaleStep): number {
  return SALE_STEP_ORDER.indexOf(step) + 1;
}
