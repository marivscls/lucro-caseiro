/** Cálculos compartilhados por app, API e calculadora pública do site. */
export {
  finalPriceWithFees,
  fixedCostShare,
  laborCost,
  laborCostPerUnit,
  profitPerUnit,
  suggestedPrice,
  totalCost,
} from "@lucro-caseiro/contracts";

/** Converte o lucro desejado em acréscimo percentual sobre o custo. */
export function profitMarkupPercent(cost: number, desiredProfit: number): number {
  if (cost <= 0 || desiredProfit <= 0) return 0;
  return (desiredProfit / cost) * 100;
}
