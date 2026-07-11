import type { MonthlyRevenue } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { formatMoneyShort, maxRevenue, monthLabel, monthOverMonthDelta } from "./domain";

function rev(revenue: number, month = "2026-01"): MonthlyRevenue {
  return { month, revenue, salesCount: 0 };
}

describe("formatMoneyShort", () => {
  it("mostra valor cheio (arredondado) abaixo de mil", () => {
    expect(formatMoneyShort(350)).toBe("R$ 350");
    expect(formatMoneyShort(999)).toBe("R$ 999");
    expect(formatMoneyShort(0)).toBe("R$ 0");
  });

  it("mostra valor cheio com ponto de milhar ate 9999", () => {
    expect(formatMoneyShort(1000)).toBe("R$ 1.000");
    expect(formatMoneyShort(1200)).toBe("R$ 1.200");
    expect(formatMoneyShort(9999)).toBe("R$ 9.999");
  });

  it("encurta para mil com uma casa e virgula a partir de 10 mil", () => {
    expect(formatMoneyShort(10000)).toBe("R$ 10,0 mil");
    expect(formatMoneyShort(15500)).toBe("R$ 15,5 mil");
  });
});

describe("monthOverMonthDelta", () => {
  it("retorna a variacao % do ultimo mes vs o anterior", () => {
    expect(monthOverMonthDelta([rev(500, "2026-05"), rev(600, "2026-06")])).toBe(20);
    expect(monthOverMonthDelta([rev(400, "2026-05"), rev(300, "2026-06")])).toBe(-25);
  });

  it("retorna null com menos de 2 meses ou mes anterior zerado", () => {
    expect(monthOverMonthDelta([])).toBeNull();
    expect(monthOverMonthDelta([rev(500)])).toBeNull();
    expect(monthOverMonthDelta([rev(0, "2026-05"), rev(600, "2026-06")])).toBeNull();
  });
});

describe("monthLabel", () => {
  it("converte AAAA-MM para abreviacao do mes", () => {
    expect(monthLabel("2026-01")).toBe("jan");
    expect(monthLabel("2026-05")).toBe("mai");
    expect(monthLabel("2026-12")).toBe("dez");
  });

  it("retorna a chave crua quando o mes e invalido", () => {
    expect(monthLabel("xx")).toBe("xx");
  });
});

describe("maxRevenue", () => {
  it("retorna 1 para serie vazia (evita divisao por zero)", () => {
    expect(maxRevenue([])).toBe(1);
  });

  it("retorna o maior faturamento da serie", () => {
    expect(maxRevenue([rev(150), rev(300), rev(90)])).toBe(300);
  });

  it("nunca retorna abaixo de 1 mesmo com tudo zero", () => {
    expect(maxRevenue([rev(0), rev(0)])).toBe(1);
  });
});
