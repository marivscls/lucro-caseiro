import { describe, expect, it } from "vitest";
import type { Packaging } from "@lucro-caseiro/contracts";

import {
  PACKAGING_EXTRA_FILTERS,
  PACKAGING_LIST_FILTERS,
  PACKAGING_TYPES,
  buildPackagingShareText,
  isLowStock,
  packagingHeroIllustrationWidth,
  packagingHeroPanelHeight,
  packagingIllustrationSlug,
  restockCount,
  totalStockCost,
  typeEmoji,
  typeLabel,
  typeStripeColor,
} from "./domain";

function makePackaging(overrides: Partial<Packaging> = {}): Packaging {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    name: "Caixa Kraft P",
    type: "box",
    unitCost: 20,
    supplier: null,
    supplierId: null,
    photoUrl: null,
    createdAt: "2026-05-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("typeLabel", () => {
  it("mapeia valores conhecidos para rótulos em português", () => {
    expect(typeLabel("box")).toBe("Caixa");
    expect(typeLabel("bag")).toBe("Sacola");
    expect(typeLabel("pot")).toBe("Pote");
    expect(typeLabel("film")).toBe("Filme");
    expect(typeLabel("label")).toBe("Rótulo");
    expect(typeLabel("other")).toBe("Outro");
  });

  it("devolve o próprio valor quando o tipo é desconhecido", () => {
    expect(typeLabel("unknown")).toBe("unknown");
  });

  it("cobre todos os tipos definidos em PACKAGING_TYPES", () => {
    for (const t of PACKAGING_TYPES) {
      expect(typeLabel(t.value)).toBe(t.label);
    }
  });
});

describe("typeEmoji", () => {
  it("retorna um emoji por tipo conhecido", () => {
    expect(typeEmoji("box")).toBe("📦");
    expect(typeEmoji("bag")).toBe("🛍️");
    expect(typeEmoji("label")).toBe("🏷️");
  });

  it("usa caixa como fallback para tipos desconhecidos", () => {
    expect(typeEmoji("xpto")).toBe("📦");
  });
});

describe("totalStockCost", () => {
  it("soma o custo unitário de todas as embalagens", () => {
    const items = [
      makePackaging({ unitCost: 20 }),
      makePackaging({ unitCost: 1.5 }),
      makePackaging({ unitCost: 0.85 }),
    ];
    expect(totalStockCost(items)).toBeCloseTo(22.35, 2);
  });

  it("é zero quando não há embalagens", () => {
    expect(totalStockCost([])).toBe(0);
  });
});

describe("list filters", () => {
  it("expõe as cinco categorias da referência sem esconder Filmes", () => {
    expect(PACKAGING_LIST_FILTERS.map((filter) => filter.label)).toEqual([
      "Todas",
      "Caixas",
      "Potes",
      "Sacolas",
      "Filmes",
    ]);
  });

  it("abre Rótulo e Outro só no botão Filtros", () => {
    expect(PACKAGING_EXTRA_FILTERS.map((filter) => filter.value)).toEqual([
      "label",
      "other",
    ]);
  });
});

describe("restockCount", () => {
  it("não inventa estoque baixo enquanto o contrato não persiste quantidade", () => {
    const items = [
      makePackaging(),
      makePackaging({ id: "33333333-3333-3333-3333-333333333333" }),
    ];
    expect(items.every((item) => isLowStock(item) === false)).toBe(true);
    expect(restockCount(items)).toBe(0);
  });
});

describe("typeStripeColor", () => {
  it("usa faixas dessaturadas por categoria", () => {
    expect(typeStripeColor("box")).toBe("#8FA0AE");
    expect(typeStripeColor("pot")).toBe("#C4B4D4");
    expect(typeStripeColor("bag")).toBe("#D2B48C");
    expect(typeStripeColor("film")).toBe("#9BB89A");
  });
});

describe("packagingIllustrationSlug", () => {
  it("gera slugs distintos para embalagens diferentes", () => {
    expect(packagingIllustrationSlug("[massa] Caixa kraft P")).toBe("caixa-kraft-p");
    expect(packagingIllustrationSlug("[massa] Caixa bolo 25 cm")).toBe(
      "caixa-bolo-25-cm",
    );
    expect(packagingIllustrationSlug("[massa] Pote 250 ml")).toBe("pote-250-ml");
    expect(packagingIllustrationSlug("[massa] Forma marmita 500 ml")).toBe(
      "forma-marmita-500-ml",
    );
    expect(packagingIllustrationSlug("[massa] Sacola personalizada")).toBe(
      "sacola-personalizada",
    );
    expect(packagingIllustrationSlug("[massa] Filme PVC")).toBe("filme-pvc");
  });
});

describe("packaging hero metrics", () => {
  it("mantém o PNG entre 48% e 52% da largura do painel", () => {
    expect(packagingHeroIllustrationWidth(328)).toBe(Math.round(328 * 0.48));
    expect(packagingHeroIllustrationWidth(358)).toBe(Math.round(358 * 0.5));
    expect(packagingHeroIllustrationWidth(398)).toBe(Math.round(398 * 0.52));
  });

  it("encolhe o painel abaixo de 360px", () => {
    expect(packagingHeroPanelHeight(320)).toBe(196);
    expect(packagingHeroPanelHeight(360)).toBe(210);
    expect(packagingHeroPanelHeight(430)).toBe(210);
  });
});

describe("buildPackagingShareText", () => {
  it("inclui nome, tipo e custo", () => {
    const text = buildPackagingShareText(makePackaging());
    expect(text).toContain("Caixa Kraft P");
    expect(text).toContain("Caixa");
    expect(text).toContain("R$");
  });

  it("inclui o fornecedor quando presente", () => {
    const text = buildPackagingShareText(
      makePackaging({ supplier: "Embalagens Brasil" }),
    );
    expect(text).toContain("Embalagens Brasil");
  });

  it("omite a linha de fornecedor quando ausente", () => {
    const text = buildPackagingShareText(makePackaging({ supplier: null }));
    expect(text).not.toContain("Fornecedor:");
  });
});
