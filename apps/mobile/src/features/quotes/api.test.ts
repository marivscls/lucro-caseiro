import type { Quote } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { normalizeQuote } from "./api";

describe("normalizeQuote", () => {
  it("deriva a rentabilidade ausente em orçamentos antigos", () => {
    const quote = {
      total: 80,
      status: "pending",
    } as Quote;

    expect(normalizeQuote(quote)).toMatchObject({
      subtotal: 80,
      discount: 0,
      discountType: null,
      discountValue: 0,
      estimatedCost: 0,
      estimatedGain: 80,
      estimatedMargin: 100,
    });
  });
});
