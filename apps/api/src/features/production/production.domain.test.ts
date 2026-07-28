import { describe, expect, it } from "vitest";

import { calculateProductionCosts } from "./production.domain";

describe("calculateProductionCosts", () => {
  it("separa custo previsto, realizado e desperdicio", () => {
    expect(
      calculateProductionCosts([
        {
          materialId: "11111111-1111-1111-1111-111111111111",
          plannedQuantity: 10,
          actualQuantity: 12,
          wasteQuantity: 2,
          unitCost: 1.5,
        },
      ]),
    ).toEqual({
      plannedCost: 15,
      actualCost: 21,
      wasteCost: 3,
    });
  });

  it("arredonda cada consumo em centavos", () => {
    expect(
      calculateProductionCosts([
        {
          materialId: "11111111-1111-1111-1111-111111111111",
          plannedQuantity: 3,
          actualQuantity: 3,
          wasteQuantity: 0,
          unitCost: 0.333,
        },
      ]),
    ).toEqual({
      plannedCost: 1,
      actualCost: 1,
      wasteCost: 0,
    });
  });
});
