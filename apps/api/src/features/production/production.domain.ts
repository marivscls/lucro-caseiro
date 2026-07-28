import type { ProductionRunMaterialInput } from "@lucro-caseiro/contracts";

export function calculateProductionCosts(
  materials: ProductionRunMaterialInput[],
): { plannedCost: number; actualCost: number; wasteCost: number } {
  const cents = materials.reduce(
    (acc, item) => ({
      planned:
        acc.planned + Math.round(item.plannedQuantity * item.unitCost * 100),
      actual:
        acc.actual +
        Math.round((item.actualQuantity + item.wasteQuantity) * item.unitCost * 100),
      waste:
        acc.waste + Math.round(item.wasteQuantity * item.unitCost * 100),
    }),
    { planned: 0, actual: 0, waste: 0 },
  );
  return {
    plannedCost: cents.planned / 100,
    actualCost: cents.actual / 100,
    wasteCost: cents.waste / 100,
  };
}
