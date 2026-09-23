import { describe, expect, it } from "vitest";

import {
  FIRST_SALE_STEP,
  nextSaleStep,
  previousSaleStep,
  saleStepPosition,
} from "./sale-steps";

describe("sale steps", () => {
  it("começa pelos produtos", () => {
    expect(FIRST_SALE_STEP).toBe(2);
    expect(saleStepPosition(2)).toBe(1);
  });

  it("segue produtos, cliente, pagamento e revisão", () => {
    expect(nextSaleStep(2)).toBe(1);
    expect(nextSaleStep(1)).toBe(3);
    expect(nextSaleStep(3)).toBe(4);
    expect(nextSaleStep(4)).toBe(4);
  });

  it("volta uma etapa e não volta antes dos produtos", () => {
    expect(previousSaleStep(4)).toBe(3);
    expect(previousSaleStep(3)).toBe(1);
    expect(previousSaleStep(1)).toBe(2);
    expect(previousSaleStep(2)).toBeNull();
  });
});
