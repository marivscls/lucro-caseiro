import { describe, expect, it } from "vitest";

import { businessCopyFor } from "./business-copy";

describe("businessCopyFor", () => {
  it("usa linguagem neutra quando o perfil ainda não existe", () => {
    const copy = businessCopyFor(null);

    expect(copy.profile).toBe("neutral");
    expect(copy.formulaNounPlural).toBe("fichas de custo");
    expect(copy.productExample).toBe("Kit personalizado");
  });

  it.each([
    ["food", "receitas", "insumos", "Marmita executiva"],
    ["crafts", "fichas técnicas", "materiais", "Vela aromática"],
    ["other", "composições de custo", "itens de custo", "Caneca térmica"],
    ["services", "fichas de serviço", "materiais utilizados", "Sessão fotográfica"],
    ["beauty", "fichas de serviço", "materiais utilizados", "Manutenção de unhas"],
  ])(
    "resolve o perfil %s",
    (profile, formulaNounPlural, materialNounPlural, productExample) => {
      const copy = businessCopyFor(profile);

      expect(copy.formulaNounPlural).toBe(formulaNounPlural);
      expect(copy.materialNounPlural).toBe(materialNounPlural);
      expect(copy.productExample).toBe(productExample);
    },
  );

  it("preserva o nome de produto definido pela marca vertical", () => {
    const copy = businessCopyFor("beauty", {
      productNoun: "procedimento",
      productNounPlural: "procedimentos",
      saleLabel: "Registrar atendimento",
      stockLabel: "Estoque",
      revenueLabel: "Faturamento",
    });

    expect(copy.productNoun).toBe("procedimento");
    expect(copy.productNounPlural).toBe("procedimentos");
  });
});
