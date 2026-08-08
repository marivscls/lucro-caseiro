/** Cálculos compartilhados por app, API e calculadora pública do site. */
export {
  finalPriceWithFees,
  fixedCostShare,
  laborCost,
  laborCostPerUnit,
  overheadPercent,
  profitPerUnit,
  revenueCosting,
  suggestedPrice,
  totalCost,
} from "@lucro-caseiro/contracts";

export interface RevenuePeriod {
  month: number;
  year: number;
  key: string;
}

export function previousCompletedMonths(now = new Date(), count = 3): RevenuePeriod[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index - 1, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return { month, year, key: `${year}-${String(month).padStart(2, "0")}` };
  });
}

export function averagePositiveRevenue(values: number[]): number {
  const positive = values.filter((value) => value > 0);
  if (positive.length === 0) return 0;
  return positive.reduce((sum, value) => sum + value, 0) / positive.length;
}

/** Converte o lucro desejado em acréscimo percentual sobre o custo. */
export function profitMarkupPercent(cost: number, desiredProfit: number): number {
  if (cost <= 0 || desiredProfit <= 0) return 0;
  return (desiredProfit / cost) * 100;
}
