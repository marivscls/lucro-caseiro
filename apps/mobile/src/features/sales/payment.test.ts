import { describe, expect, it } from "vitest";

import { PAYMENT_LABELS, PAYMENT_OPTIONS, paymentLabel } from "./payment";

describe("paymentLabel", () => {
  it("traduz os metodos conhecidos para pt-BR", () => {
    expect(paymentLabel("pix")).toBe("Pix");
    expect(paymentLabel("cash")).toBe("Dinheiro");
    expect(paymentLabel("card")).toBe("Cartão");
    expect(paymentLabel("credit")).toBe("Fiado");
    expect(paymentLabel("transfer")).toBe("Transferência");
  });

  it("faz fallback para o valor cru quando desconhecido", () => {
    expect(paymentLabel("bitcoin")).toBe("bitcoin");
    expect(paymentLabel("")).toBe("");
  });
});

describe("PAYMENT_OPTIONS", () => {
  it("expoe todas as formas de pagamento na ordem padrao", () => {
    expect(PAYMENT_OPTIONS).toHaveLength(Object.keys(PAYMENT_LABELS).length);
    expect(PAYMENT_OPTIONS[0]).toEqual({ value: "pix", label: "Pix" });
    expect(PAYMENT_OPTIONS.every((o) => o.label === PAYMENT_LABELS[o.value])).toBe(true);
  });
});
