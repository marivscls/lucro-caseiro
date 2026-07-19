import type { LabelData } from "@lucro-caseiro/contracts";
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
});
