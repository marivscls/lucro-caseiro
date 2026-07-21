import {
  LabelLayoutDto,
  calculateLabelSheetCapacity,
  type LabelData,
} from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { buildLabelHtml } from "./label-export";

function labelData(): LabelData {
  return {
    productName: "Bolo <caseiro>",
    note: "Manter refrigerado & servir gelado",
    manufacturingDate: "2026-07-19",
    expirationDate: "2026-07-26",
    producerName: "Doces da Maria",
    producerPhone: "(11) 99999-9999",
    // Dados antigos continuam aceitos no JSON, mas não entram na etiqueta simples.
    ingredients: "Farinha, ovos e açúcar",
    nutrition: { calories: "300 kcal" },
  };
}

describe("buildLabelHtml", () => {
  it("gera uma etiqueta simples e escapa os dados informados", () => {
    const html = buildLabelHtml(labelData(), "classico");

    expect(html).toContain("Bolo &lt;caseiro&gt;");
    expect(html).toContain("Manter refrigerado &amp; servir gelado");
    expect(html).toContain("Feito em");
    expect(html).toContain("19/07/2026");
    expect(html).not.toContain("INFORMAÇÃO NUTRICIONAL");
    expect(html).not.toContain("Ingredientes:");
  });

  it("gera oito etiquetas em uma folha cheia", () => {
    const html = buildLabelHtml(labelData(), "classico", null, null, 8);

    expect(html.match(/class="label-card"/g)).toHaveLength(8);
  });

  it("aplica medidas personalizadas e a quantidade configurada", () => {
    const data = {
      ...labelData(),
      layout: { widthMm: 50, heightMm: 30, copiesPerSheet: 20 },
    } satisfies LabelData;
    const html = buildLabelHtml(data, "classico", null, null, 20);

    expect(html).toContain("width: 50mm");
    expect(html).toContain("height: 30mm");
    expect(html.match(/class="label-card"/g)).toHaveLength(20);
  });

  it("limita a quantidade à capacidade física da folha A4", () => {
    const data = {
      ...labelData(),
      layout: { widthMm: 90, heightMm: 60, copiesPerSheet: 8 },
    } satisfies LabelData;
    const html = buildLabelHtml(data, "classico", null, null, 99);

    expect(calculateLabelSheetCapacity(90, 60)).toBe(8);
    expect(html.match(/class="label-card"/g)).toHaveLength(8);
    expect(
      LabelLayoutDto.safeParse({ widthMm: 90, heightMm: 60, copiesPerSheet: 9 }).success,
    ).toBe(false);
  });
});
